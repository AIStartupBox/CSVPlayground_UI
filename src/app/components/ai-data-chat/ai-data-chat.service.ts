import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

// Single sheet response structure
export interface SingleSheetUploadResponse {
  success: boolean;
  message: string;
  id: string;
  table_data: string; // JSON string of array: "[{\"id\": 1, \"name\": \"Alice\"}, ...]"
}

// Multi-sheet response structure (for Excel files)
export interface MultiSheetUploadResponse {
  success: boolean;
  message: string;
  id: string;
  table_data: string; // JSON string of object: "{\"Sheet1\": [{...}], \"Sheet2\": [{...}]}"
}

// Union type for both response structures
export type FileUploadResponse = SingleSheetUploadResponse | MultiSheetUploadResponse;

// Parsed table data interfaces
export interface ParsedSingleSheetData {
  type: 'single';
  id: string;
  data: any[];
  columns: string[];
}

export interface ParsedMultiSheetData {
  type: 'multi';
  id: string;
  sheets: {
    [sheetName: string]: {
      data: any[];
      columns: string[];
    };
  };
  sheetNames: string[];
}

export type ParsedTableData = ParsedSingleSheetData | ParsedMultiSheetData;

// Upload progress interface
export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  response?: ParsedTableData;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiDataChatService {
  private baseUrl = 'http://localhost:8000/api/v1';
  private uploadUrl = `${this.baseUrl}/upload-file`;

  constructor(private http: HttpClient) { }

  /**
   * Upload file with progress tracking
   * @param file The file to upload
   * @returns Observable that emits upload progress and final result
   */
  uploadFile(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const request = new HttpRequest('POST', this.uploadUrl, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request<FileUploadResponse>(request).pipe(
      map(event => {
        console.log('Upload event:', event);
        return this.handleUploadEvent(event);
      })
    );
  }

  /**
   * Handle HTTP events and convert to upload progress
   */
  private handleUploadEvent(event: HttpEvent<FileUploadResponse>): UploadProgress {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (event.total) {
          const progress = Math.round((100 * event.loaded) / event.total);
          return {
            progress: progress,
            status: 'uploading'
          };
        }
        return {
          progress: 0,
          status: 'uploading'
        };

      case HttpEventType.Response:
        const parsedData = this.parseTableData(event.body!);
        return {
          progress: 100,
          status: 'complete',
          response: parsedData
        };

      default:
        return {
          progress: 0,
          status: 'uploading'
        };
    }
  }

  /**
   * Parse table_data from API response
   * Handles both single sheet and multi-sheet structures
   */
  private parseTableData(response: FileUploadResponse): ParsedTableData {
    try {
      const parsedTableData = JSON.parse(response.table_data);

      // Check if it's a multi-sheet structure (object with sheet names as keys)
      if (this.isMultiSheetData(parsedTableData)) {
        const sheets: { [key: string]: { data: any[]; columns: string[] } } = {};
        const sheetNames = Object.keys(parsedTableData);

        sheetNames.forEach(sheetName => {
          const sheetData = parsedTableData[sheetName];
          sheets[sheetName] = {
            data: sheetData,
            columns: sheetData.length > 0 ? Object.keys(sheetData[0]) : []
          };
        });

        return {
          type: 'multi',
          id: response.id,
          sheets: sheets,
          sheetNames: sheetNames
        };
      } else {
        // Single sheet structure (array of objects)
        return {
          type: 'single',
          id: response.id,
          data: parsedTableData,
          columns: parsedTableData.length > 0 ? Object.keys(parsedTableData[0]) : []
        };
      }
    } catch (error) {
      console.error('Error parsing table data:', error);
      // Return empty single sheet data on error
      return {
        type: 'single',
        id: response.id,
        data: [],
        columns: []
      };
    }
  }

  /**
   * Check if parsed data is multi-sheet structure
   * Multi-sheet: object where values are arrays
   * Single-sheet: direct array
   */
  private isMultiSheetData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // If it's an array, it's single sheet
    if (Array.isArray(data)) {
      return false;
    }

    // If it's an object, check if all values are arrays
    const values = Object.values(data);
    return values.length > 0 && values.every(val => Array.isArray(val));
  }

  /**
   * Get preview data (first N rows)
   */
  getPreviewData(parsedData: ParsedTableData, maxRows: number = 5): any[] {
    if (parsedData.type === 'single') {
      return parsedData.data.slice(0, maxRows);
    } else {
      // For multi-sheet, return preview of first sheet
      const firstSheetName = parsedData.sheetNames[0];
      if (firstSheetName) {
        return parsedData.sheets[firstSheetName].data.slice(0, maxRows);
      }
      return [];
    }
  }

  /**
   * Get columns for display
   */
  getColumns(parsedData: ParsedTableData, sheetName?: string): string[] {
    if (parsedData.type === 'single') {
      return parsedData.columns;
    } else {
      const sheet = sheetName || parsedData.sheetNames[0];
      return parsedData.sheets[sheet]?.columns || [];
    }
  }

  /**
   * Get total row count
   */
  getTotalRows(parsedData: ParsedTableData): number {
    if (parsedData.type === 'single') {
      return parsedData.data.length;
    } else {
      return Object.values(parsedData.sheets).reduce((total, sheet) => total + sheet.data.length, 0);
    }
  }

  // Signals for workflow chat streaming
  private workflowStreamingContentSignal = signal<string>('');
  private workflowIsStreamingSignal = signal<boolean>(false);
  private workflowEventSourceSignal = signal<EventSource | null>(null);

  // Expose readonly signals
  readonly workflowStreamingContent = this.workflowStreamingContentSignal.asReadonly();
  readonly workflowIsStreaming = this.workflowIsStreamingSignal.asReadonly();

  /**
   * Start workflow chat stream: POST request that returns SSE stream
   */
  startWorkflowChatStream(userQuestion: string, contextId: string, previousMessages: any[], threadId?: string): void {
    this.closeWorkflowEventSource();
    this.workflowStreamingContentSignal.set('');
    this.workflowIsStreamingSignal.set(true);

    const payload = {
      user_question: userQuestion,
      context_id: contextId,
      previous_messages: previousMessages,
      thread_id: threadId || this.generateUUID()
    };
    if (payload.previous_messages && Array.isArray(payload.previous_messages) && payload.previous_messages.length >= 2) {
      payload.previous_messages = payload.previous_messages.slice(1, -1);
    }

    const url = `${this.baseUrl}/workflow/chat/stream`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.body;
      })
      .then(body => {
        if (!body) {
          throw new Error('Response body is null');
        }
        this.processStream(body);
      })
      .catch(error => {
        console.error('Error initiating workflow stream:', error);
        this.workflowIsStreamingSignal.set(false);
      });
  }

  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.finishWorkflowStreaming();
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix
            try {
              const parsedData = JSON.parse(data);
              this.handleWorkflowStreamChunk(parsedData);
            } catch (error) {
              console.error('Error parsing SSE data:', error, 'Data:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      this.finishWorkflowStreaming();
    }
  }

  private handleWorkflowStreamChunk(data: any): void {
    if (data.response) {
      this.workflowStreamingContentSignal.update((content: string) => content + data.response);
    }
    if (data.status === 'completed') {
      this.finishWorkflowStreaming();
    }
    // Optionally handle other event types (next_node, token_count, etc.)
  }

  private finishWorkflowStreaming(): void {
    this.closeWorkflowEventSource();
    this.workflowIsStreamingSignal.set(false);
  }

  private closeWorkflowEventSource(): void {
    const currentEventSource = this.workflowEventSourceSignal();
    if (currentEventSource) {
      currentEventSource.close();
      this.workflowEventSourceSignal.set(null);
    }
  }

  private generateUUID(): string {
    return uuidv4();
  }
}
