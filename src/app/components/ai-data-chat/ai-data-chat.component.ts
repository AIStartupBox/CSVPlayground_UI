import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
  timestamp: Date;
  includeActions?: boolean;
}

@Component({
  selector: 'app-ai-data-chat',
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './ai-data-chat.component.html',
  styleUrl: './ai-data-chat.component.css'
})
export class AiDataChatComponent implements OnInit {
  private messageService = inject(MessageService);

  // File upload properties
  currentFile: File | null = null;
  uploadProgress: number = 0;
  showProgressBar: boolean = false;
  showError: boolean = false;
  errorText: string = '';

  // Chat properties
  chatHistory: ChatMessage[] = [];
  chatInput: string = '';
  isTyping: boolean = false;
  welcomeMessageVisible: boolean = true;
  chatInputDisabled: boolean = true;

  // UI state
  currentView: 'upload' | 'chat' = 'upload';
  showExportDropdown: boolean = false;
  isMobileView: boolean = false;

  // Suggested questions
  suggestedQuestions: string[] = [
    'What are the key statistics?',
    'Show me a summary of the data',
    'What trends can you identify?',
    'Are there any outliers?'
  ];

  // Data preview
  previewData: any[] = [];
  previewColumns: string[] = ['Column 1', 'Column 2', 'Column 3'];

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    if (window.innerWidth >= 1024) {
      this.resetViewStyles();
    } else {
      this.switchToView(this.currentView);
    }
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 1024;
  }

  // File handling methods
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  handleFiles(files: FileList): void {
    if (files.length === 0) return;

    const file = files[0];
    const validTypes = ['.csv', '.json', '.xlsx', '.xls'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExt)) {
      this.showErrorMessage('Invalid file type. Please upload CSV, JSON, or Excel files.');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.showErrorMessage('File too large (max 2MB). Please upload a smaller file.');
      return;
    }

    this.currentFile = file;
    this.uploadFile(file);
  }

  uploadFile(file: File): void {
    this.hideErrorMessage();
    this.showProgressBar = true;
    this.uploadProgress = 0;

    const interval = setInterval(() => {
      this.uploadProgress += 10;

      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.showProgressBar = false;
          this.showUploadSuccess(file);
        }, 500);
      }
    }, 200);
  }

  showUploadSuccess(file: File): void {
    // Show data preview
    this.previewData = [
      { 'Column 1': 'Sample', 'Column 2': 'Data', 'Column 3': 'Row 1' },
      { 'Column 1': 'Sample', 'Column 2': 'Data', 'Column 3': 'Row 2' }
    ];

    // Enable chat
    this.enableChat();

    // Add AI greeting
    this.addAIMessage(`Great! I've loaded <strong>${file.name}</strong>. I can help you analyze this data. What would you like to know?`);

    // Auto-switch to chat on mobile
    if (this.isMobileView) {
      setTimeout(() => {
        this.switchToView('chat');
      }, 1000);
    }
  }

  removeFile(): void {
    this.currentFile = null;
    this.previewData = [];
    this.chatHistory = [];
    this.chatInputDisabled = true;
    this.welcomeMessageVisible = true;
    this.switchToView('upload');
  }

  // Chat methods
  enableChat(): void {
    this.chatInputDisabled = false;
    this.welcomeMessageVisible = false;
  }

  sendMessage(): void {
    const message = this.chatInput.trim();
    if (!message) return;

    this.addUserMessage(message);
    this.chatInput = '';

    // Simulate AI response
    setTimeout(() => {
      this.isTyping = true;
      setTimeout(() => {
        this.isTyping = false;
        this.respondToQuery(message);
      }, 1500);
    }, 500);
  }

  addUserMessage(message: string): void {
    this.chatHistory.push({
      role: 'user',
      message: message,
      timestamp: new Date()
    });
  }

  addAIMessage(message: string, includeActions: boolean = false): void {
    this.chatHistory.push({
      role: 'ai',
      message: message,
      timestamp: new Date(),
      includeActions: includeActions
    });
  }

  respondToQuery(query: string): void {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('statistic') || lowerQuery.includes('summary')) {
      this.addAIMessage(
        'Based on your data, here are the key statistics:<br><br><strong>Total Rows:</strong> 150<br><strong>Total Columns:</strong> 5<br><strong>Average Value:</strong> 42.5<br><strong>Max Value:</strong> 98<br><strong>Min Value:</strong> 12',
        true
      );
    } else if (lowerQuery.includes('trend')) {
      this.addAIMessage(
        'I\'ve identified an upward trend in your data over the past 6 months, with a 23% increase in the primary metric. Would you like me to visualize this?',
        true
      );
    } else if (lowerQuery.includes('outlier')) {
      this.addAIMessage(
        'I found 3 outliers in your dataset. They appear in rows 45, 67, and 123, where values exceed 3 standard deviations from the mean.',
        true
      );
    } else {
      this.addAIMessage(
        'I\'ve analyzed your query. The data shows interesting patterns that I can help you explore further. Would you like me to break this down by category or time period?',
        true
      );
    }
  }

  askQuestion(question: string): void {
    this.chatInput = question;
    this.sendMessage();
  }

  clearChat(): void {
    if (this.chatHistory.length === 0) return;

    if (confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      this.chatHistory = [];
      this.welcomeMessageVisible = true;

      if (this.currentFile) {
        setTimeout(() => {
          this.welcomeMessageVisible = false;
          this.addAIMessage(`Hello! I'm ready to help you analyze <strong>${this.currentFile!.name}</strong>. What would you like to know?`);
        }, 2000);
      }
    }
  }

  // View switching methods
  toggleMobileView(): void {
    if (this.currentView === 'upload') {
      this.switchToView('chat');
    } else {
      this.switchToView('upload');
    }
  }

  switchToView(view: 'upload' | 'chat'): void {
    this.currentView = view;
  }

  resetViewStyles(): void {
    // Reset view styles for desktop
  }

  // Utility methods
  showErrorMessage(message: string): void {
    this.errorText = message;
    this.showError = true;
  }

  hideErrorMessage(): void {
    this.showError = false;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return 'csv';
    if (ext === 'json') return 'code';
    if (ext === 'xlsx' || ext === 'xls') return 'excel';
    return 'alt';
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  onChatInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
