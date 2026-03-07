import {
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import * as htmlToImage from 'html-to-image';
import { AirtableRecord } from '../../models/student.model';

@Component({
  selector: 'app-student-badge',
  standalone: true,
  imports: [],
  templateUrl: './student-badge.component.html',
  styleUrl: './student-badge.component.css',
})
export class StudentBadgeComponent {
  @Input() student!: AirtableRecord;

  @ViewChild('badgeElement') badgeElement!: ElementRef<HTMLElement>;

  get photoUrl(): string {
    return this.student?.fields?.Pic?.[0]?.url ?? '';
  }

  async generateBadgeImage(): Promise<string> {
    const el = this.badgeElement?.nativeElement;
    if (!el) {
      throw new Error('Badge element not found');
    }
    try {
      const dataUrl = await htmlToImage.toPng(el, {
        width: 1080,
        height: 1080,
        pixelRatio: 1,
        cacheBust: true,
      });
      return dataUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to generate badge image: ${message}`);
    }
  }
}
