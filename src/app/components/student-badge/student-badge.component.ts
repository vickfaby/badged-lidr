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
  /** Si se proporciona, se usa en lugar de la foto de Airtable (p. ej. edición local). */
  @Input() photoOverride?: string;

  @ViewChild('badgeElement') badgeElement!: ElementRef<HTMLElement>;

  get photoUrl(): string {
    if (this.photoOverride) return this.photoOverride;
    const pic = this.student?.fields?.Pic?.[0];
    if (!pic) return '';
    // Preferir thumbnails (full o large) que suelen ser JPEG/PNG seguros para web,
    // especialmente si el original es HEIC (que no se ve en navegadores).
    return pic.thumbnails?.['full']?.url
      || pic.thumbnails?.['large']?.url
      || pic.thumbnails?.['small']?.url
      || pic.url;
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
        skipFonts: true, // evita SecurityError al leer cssRules de Google Fonts (cross-origin)
      });
      return dataUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to generate badge image: ${message}`);
    }
  }
}
