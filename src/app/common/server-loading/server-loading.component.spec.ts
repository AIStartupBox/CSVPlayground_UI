import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerLoadingComponent } from './server-loading.component';

describe('ServerLoadingComponent', () => {
  let component: ServerLoadingComponent;
  let fixture: ComponentFixture<ServerLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerLoadingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
