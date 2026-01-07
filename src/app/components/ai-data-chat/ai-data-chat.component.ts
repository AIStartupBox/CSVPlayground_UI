import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MarkdownModule, provideMarkdown } from 'ngx-markdown';
import { AiDataChatService, ParsedTableData } from './ai-data-chat.service';

interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
  timestamp: Date;
  includeActions?: boolean;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-ai-data-chat',
  imports: [CommonModule, FormsModule, ToastModule, MarkdownModule],
  providers: [MessageService, provideMarkdown()],
  templateUrl: './ai-data-chat.component.html',
  styleUrl: './ai-data-chat.component.css'
})
export class AiDataChatComponent implements OnInit {
  private messageService = inject(MessageService);
  private aiDataChatService = inject(AiDataChatService);

  // File upload properties
  currentFile: File | null = null;
  uploadProgress: number = 0;
  showProgressBar: boolean = false;
  showError: boolean = false;
  errorText: string = '';
  uploadedDataId: string = '';
  parsedTableData: ParsedTableData | null = null;

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

    // Subscribe to streaming content changes
    this.subscribeToStreamingContent();
  }

  private subscribeToStreamingContent(): void {
    // Use effect to watch for streaming content changes
    const checkStreaming = () => {
      const streamingContent = this.aiDataChatService.workflowStreamingContent();
      const isStreaming = this.aiDataChatService.workflowIsStreaming();

      if (streamingContent && this.chatHistory.length > 0) {
        this.updateLastAIMessage(streamingContent, isStreaming);
        this.scrollToBottom();
      }

      // Check if streaming finished
      if (!isStreaming && streamingContent && this.chatHistory.length > 0) {
        const lastMessage = this.chatHistory[this.chatHistory.length - 1];
        if (lastMessage && lastMessage.role === 'ai' && lastMessage.isStreaming) {
          lastMessage.isStreaming = false;
        }
      }

      requestAnimationFrame(checkStreaming);
    };

    checkStreaming();
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

    console.log('Starting file upload:', file.name);

    // Call the API service
    this.aiDataChatService.uploadFile(file).subscribe({
      next: (progress) => {
        console.log('Upload progress:', progress);
        this.uploadProgress = progress.progress;

        if (progress.status === 'complete' && progress.response) {
          this.showProgressBar = false;
          this.parsedTableData = progress.response;
          this.uploadedDataId = progress.response.id;
          this.showUploadSuccess(file);
        } else if (progress.status === 'error') {
          this.showProgressBar = false;
          this.showErrorMessage(progress.error || 'Failed to upload file. Please try again.');
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.showProgressBar = false;
        this.showErrorMessage(error.message || 'Failed to upload file. Please try again.');

        this.messageService.add({
          severity: 'error',
          summary: 'Upload Error',
          detail: error.error?.message || 'Failed to upload file. Please try again.',
          life: 5000
        });
      },
      complete: () => {
        console.log('Upload stream completed');
      }
    });
  }

  showUploadSuccess(file: File): void {
    if (!this.parsedTableData) {
      return;
    }

    // Show data preview using actual data
    this.previewData = this.aiDataChatService.getPreviewData(this.parsedTableData, 2);
    this.previewColumns = this.aiDataChatService.getColumns(this.parsedTableData);

    // Enable chat
    this.enableChat();

    // Prepare summary message
    const totalRows = this.aiDataChatService.getTotalRows(this.parsedTableData);
    let summaryMessage = `Great! I've loaded <strong>${file.name}</strong>. `;

    if (this.parsedTableData.type === 'multi') {
      const sheetCount = this.parsedTableData.sheetNames.length;
      summaryMessage += `This Excel file contains <strong>${sheetCount} sheet(s)</strong> with a total of <strong>${totalRows} rows</strong>. `;
    } else {
      summaryMessage += `This file contains <strong>${totalRows} rows</strong> and <strong>${this.previewColumns.length} columns</strong>. `;
    }

    summaryMessage += 'I can help you analyze this data. What would you like to know?';

    // Add AI greeting
    this.addAIMessage(summaryMessage);

    // Show success toast
    this.messageService.add({
      severity: 'success',
      summary: 'Upload Successful',
      detail: `${file.name} uploaded successfully!`,
      life: 4000
    });

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
    this.previewColumns = [];
    this.chatHistory = [];
    this.chatInputDisabled = true;
    this.welcomeMessageVisible = true;
    this.parsedTableData = null;
    this.uploadedDataId = '';
    this.switchToView('upload');
  }

  // Chat methods
  enableChat(): void {
    this.chatInputDisabled = false;
    this.welcomeMessageVisible = false;
  }

  sendMessage(): void {
    const message = this.chatInput.trim();
    if (!message || this.aiDataChatService.workflowIsStreaming()) return;

    this.addUserMessage(message);
    this.chatInput = '';

    // Add a streaming AI message placeholder
    this.addAIMessage('', false, true);

    // Start workflow chat stream
    this.aiDataChatService.startWorkflowChatStream(
      message,
      this.uploadedDataId, // contextId from uploaded file
      this.chatHistory.map(msg => ({ role: msg.role, content: msg.message })), // previous messages with 'content'
      undefined // threadId (optional)
    );

    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  addUserMessage(message: string): void {
    this.chatHistory.push({
      role: 'user',
      message: message,
      timestamp: new Date()
    });
  }

  addAIMessage(message: string, includeActions: boolean = false, isStreaming: boolean = false): void {
    this.chatHistory.push({
      role: 'ai',
      message: message,
      timestamp: new Date(),
      includeActions: includeActions,
      isStreaming: isStreaming
    });
  }

  updateLastAIMessage(message: string, isStreaming: boolean = false): void {
    const lastMessage = this.chatHistory[this.chatHistory.length - 1];
    if (lastMessage && lastMessage.role === 'ai') {
      lastMessage.message = message;
      lastMessage.isStreaming = isStreaming;
    }
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
