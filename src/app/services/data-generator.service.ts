import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Request Payload Interface
export interface GenerateCSVRequest {
  context: string;
  model_name: string;
  no_of_rows: number;
  no_of_columns: number;
  quality: string;
}

// Response Interfaces
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface Metadata {
  model_used: string;
  rows_generated: number;
  quality: string;
  generation_time: number;
  context_length: number;
  columns_generated: number;
  token_usage: TokenUsage;
}

export interface ResponseData {
  columns: string[];
  rows: string[][];
}

export interface GenerateCSVResponse {
  success: boolean;
  message: string;
  csv_data: string;
  data: ResponseData;
  metadata: Metadata;
}

// Insert Endpoint Interfaces
export interface InsertDataRequest {
  data: ResponseData;
}

export interface InsertDataResponse {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataGeneratorService {
  private apiUrl = 'https://csv-playground-backend.onrender.com/api/v1/generate-csv';
  private insertUrl = 'https://csv-playground-backend.onrender.com/api/v1/insert';

  constructor(private http: HttpClient) { }

  generateCSV(payload: GenerateCSVRequest): Observable<GenerateCSVResponse> {
    return this.http.post<GenerateCSVResponse>(this.apiUrl, payload);
  }

  insertData(payload: InsertDataRequest): Observable<InsertDataResponse> {
    return this.http.post<InsertDataResponse>(this.insertUrl, payload);
  }
}
