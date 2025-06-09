class EditAction<T> {
  final T previousState;
  final T newState;

  EditAction({required this.previousState, required this.newState});
}

class EditHistory<T> {
  final List<EditAction<T>> _undoStack = [];
  final List<EditAction<T>> _redoStack = [];

  void recordChange(T oldState, T newState) {
    _undoStack.add(EditAction(previousState: oldState, newState: newState));
    _redoStack.clear();
  }

  T? undo(T currentState) {
    if (_undoStack.isEmpty) return null;
    final last = _undoStack.removeLast();
    _redoStack.add(EditAction(previousState: last.newState, newState: last.previousState));
    return last.previousState;
  }

  T? redo(T currentState) {
    if (_redoStack.isEmpty) return null;
    final next = _redoStack.removeLast();
    _undoStack.add(EditAction(previousState: next.newState, newState: next.previousState));
    return next.previousState;
  }

  void clear() {
    _undoStack.clear();
    _redoStack.clear();
  }

  bool get canUndo => _undoStack.isNotEmpty;
  bool get canRedo => _redoStack.isNotEmpty;
}
