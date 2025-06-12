import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from './supabase';
import { SignupData, LoginData, User } from '@shared/schema';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// Email transporter (configure with your email service)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class AuthService {
  // Generate JWT token
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  // Verify JWT token
  static verifyToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return null;
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate verification token
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send verification email
  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@pdf4ever.com',
      to: email,
      subject: 'Verify your PDF4EVER account',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">Welcome to PDF4EVER!</h2>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            If you didn't create an account with PDF4EVER, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
  }

  // Register user with email/password
  static async signup(signupData: SignupData): Promise<{ user: User; token: string }> {
    const { email, password, firstName, lastName } = signupData;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        auth_provider: 'email',
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await supabase
      .from('verification_tokens')
      .insert({
        email,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      });

    // Send verification email
    try {
      await this.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error here - user is created, just email failed
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  // Login with email/password
  static async login(loginData: LoginData): Promise<{ user: User; token: string }> {
    const { email, password } = loginData;

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Invalid email or password');
    }

    if (!user.password) {
      throw new Error('Please login using your social account (Google/Facebook)');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return user;
  }

  // Verify email token
  static async verifyEmail(token: string): Promise<boolean> {
    const { data: verificationToken, error } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !verificationToken) {
      return false;
    }

    // Check if token is expired
    if (new Date() > new Date(verificationToken.expires_at)) {
      return false;
    }

    // Update user as verified
    await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('email', verificationToken.email);

    // Delete verification token
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('token', token);

    return true;
  }

  // Handle OAuth signup/login
  static async handleOAuthUser(
    provider: 'google',
    profile: any
  ): Promise<{ user: User; token: string; isNewUser: boolean }> {
    const email = profile.email || profile._json?.email;
    const firstName = profile.name?.givenName || profile._json?.given_name || profile.displayName?.split(' ')[0];
    const lastName = profile.name?.familyName || profile._json?.family_name || profile.displayName?.split(' ')[1];
    const profileImageUrl = profile.photos?.[0]?.value || profile._json?.picture;

    if (!email) {
      throw new Error('Email is required from OAuth provider');
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user: User;
    let isNewUser = false;

    if (existingUser) {
      // User exists, update profile if needed
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          first_name: firstName || existingUser.first_name,
          last_name: lastName || existingUser.last_name,
          profile_image_url: profileImageUrl || existingUser.profile_image_url,
          auth_provider: provider,
          auth_provider_id: profile.id,
          is_verified: true, // OAuth users are automatically verified
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }

      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          profile_image_url: profileImageUrl,
          auth_provider: provider,
          auth_provider_id: profile.id,
          is_verified: true, // OAuth users are automatically verified
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }

      user = newUser;
      isNewUser = true;
    }

    // Store OAuth account info
    await supabase
      .from('accounts')
      .upsert({
        user_id: user.id,
        provider,
        provider_account_id: profile.id,
        access_token: profile.accessToken,
        refresh_token: profile.refreshToken,
        token_type: 'Bearer',
      });

    // Generate JWT token
    const token = this.generateToken(user.id);

    return { user, token, isNewUser };
  }
}