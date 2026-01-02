import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-server-loading',
  imports: [CommonModule],
  templateUrl: './server-loading.component.html',
  styleUrl: './server-loading.component.css'
})
export class ServerLoadingComponent implements OnInit, OnDestroy {
  messages: { icon: string, text: string }[] = [
    { icon: 'fa-solid fa-power-off', text: 'Waking up the server... please hang tight' },
    { icon: 'fa-solid fa-gears', text: 'Getting things ready for you' },
    { icon: 'fa-solid fa-rocket', text: 'Server is starting up, this may take a moment' },
    { icon: 'fa-solid fa-spinner', text: 'Loading the application... thanks for waiting' },
    { icon: 'fa-solid fa-circle-notch', text: 'Almost there... preparing everything' },
    { icon: 'fa-solid fa-fire', text: 'Our server is warming up... stay with us' },
    { icon: 'fa-solid fa-clock', text: 'Just a few seconds more... we\'re on it' },
    { icon: 'fa-solid fa-wrench', text: 'Setting things up behind the scenes' },
    { icon: 'fa-solid fa-hourglass-half', text: 'Good things take a little time... thanks for your patience' },
    { icon: 'fa-solid fa-cloud-arrow-up', text: 'Bringing everything online for you' },
    { icon: 'fa-solid fa-server', text: 'Please wait while the server gets ready' },
    { icon: 'fa-solid fa-play', text: 'Starting services... won\'t be long' },
    { icon: 'fa-solid fa-arrows-rotate', text: 'Hang on! We\'re loading the experience' },
    { icon: 'fa-solid fa-circle-up', text: 'Server booting up... thank you for waiting' },
    { icon: 'fa-solid fa-star', text: 'Preparing something awesome for you' },
    { icon: 'fa-solid fa-heart', text: 'Thank you for your patience' }
  ];
  currentMessageIndex: number = 0;
  currentMessage: { icon: string, text: string } = { icon: '', text: '' };
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
