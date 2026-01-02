import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-server-loading',
  imports: [CommonModule],
  templateUrl: './server-loading.component.html',
  styleUrl: './server-loading.component.css'
})
export class ServerLoadingComponent implements OnInit, OnDestroy {
  messages: string[] = [
    'Server Loading.....',
    'Please wait for sometime.....',
    'Thanks for your Patience.....',
    'Please wait for sometime.....'
  ];
  currentMessageIndex: number = 0;
  currentMessage: string = '';
  private intervalId: any;

  ngOnInit() {
    this.startMessageLoop();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startMessageLoop() {
    this.currentMessage = this.messages[0];
    this.intervalId = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
      this.currentMessage = this.messages[this.currentMessageIndex];
    }, 2000);
  }
}
