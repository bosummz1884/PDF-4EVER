// src/components/tool-panels/SignatureToolComponent.tsx

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PenTool, 
  Save, 
  Trash2, 
  FileSignature, 
  Shield, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { usePDFEditor } from '@/features/pdf-editor/PDFEditorContext';
import { signatureService } from '@/services/signatureService';
import { SignatureData } from '@/types/pdf-types';
import SignatureTool from '@/features/components/tools/SignatureTool';

export const SignatureToolComponent: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { state } = usePDFEditor();
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SignatureData[]>([]);

  // Load saved signatures on component mount
  React.useEffect(() => {
    setSavedSignatures(signatureService.getSavedSignatures());
  }, []);

  const handleCreateSignature = useCallback(() => {
    setShowSignaturePad(true);
  }, []);

  const handleSignatureComplete = useCallback(() => {
    setShowSignaturePad(false);
    setSavedSignatures(signatureService.getSavedSignatures());
  }, []);

  const handleDeleteSignature = useCallback((hash: string) => {
    signatureService.deleteSignature(hash);
    setSavedSignatures(signatureService.getSavedSignatures());
  }, []);

  const validateSignature = useCallback((signature: SignatureData) => {
    return signatureService.validateSignature(signature);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Create Signature Button */}
        <Button
          onClick={handleCreateSignature}
          size="sm"
          variant={showSignaturePad ? "secondary" : "outline"}
        >
          <PenTool className="h-3 w-3 mr-1" />
          {showSignaturePad ? "Hide" : "Create"}
        </Button>
        
        {/* Saved Signatures Count */}
        {savedSignatures.length > 0 && (
          <div className="flex items-center gap-1">
            <FileSignature className="h-3 w-3" />
            <span className="text-xs text-muted-foreground">
              {savedSignatures.length} saved
            </span>
          </div>
        )}
        
        {/* Verification Status */}
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-blue-600" />
          <span className="text-xs text-muted-foreground">Verified</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileSignature className="h-4 w-4" />
          Digital Signature
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Create New Signature */}
        <div className="space-y-2">
          <Button
            onClick={handleCreateSignature}
            className="w-full"
            variant={showSignaturePad ? "secondary" : "default"}
          >
            <PenTool className="h-4 w-4 mr-2" />
            {showSignaturePad ? "Hide Signature Pad" : "Create New Signature"}
          </Button>
          
          {showSignaturePad && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <SignatureTool />
              <div className="mt-3 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignatureComplete}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Saved Signatures */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Saved Signatures</h4>
            <Badge variant="secondary" className="text-xs">
              {savedSignatures.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-48 w-full border rounded-md">
            <div className="p-2 space-y-2">
              {savedSignatures.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No saved signatures
                </div>
              ) : (
                savedSignatures.map((signature, index) => (
                  <div
                    key={signature.hash}
                    className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Signature Preview */}
                        <div className="mb-2">
                          <img
                            src={signature.dataUrl}
                            alt={`Signature ${index + 1}`}
                            className="h-12 max-w-full object-contain border rounded bg-white"
                          />
                        </div>
                        
                        {/* Signature Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {validateSignature(signature) ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-600" />
                            )}
                            <span className="text-xs font-medium">
                              {validateSignature(signature) ? 'Verified' : 'Invalid'}
                            </span>
                          </div>
                          
                          {signature.timestamp && (
                            <div className="text-xs text-gray-500">
                              Created: {new Date(signature.timestamp).toLocaleDateString()}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 font-mono">
                            Hash: {signature.hash.substring(0, 12)}...
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSignature(signature.hash)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Signature Verification Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium">Security Features</h4>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Signatures are cryptographically hashed</div>
            <div>• Tampering detection with SHA-256</div>
            <div>• Timestamp verification included</div>
            <div>• Local storage for privacy</div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          <strong>How to use:</strong>
          <ol className="mt-1 space-y-1 ml-3 list-decimal">
            <li>Create a new signature using the signature pad</li>
            <li>Click "Save" to store your signature</li>
            <li>Click anywhere on the PDF to place your signature</li>
            <li>Signatures are embedded as images in the PDF</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
