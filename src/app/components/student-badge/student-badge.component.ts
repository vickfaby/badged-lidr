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
  /** Si se proporciona, se usa en lugar del nombre+apellido (edición local). */
  @Input() nameOverride?: string;

  @ViewChild('badgeElement') badgeElement!: ElementRef<HTMLElement>;

  get displayName(): string {
    const override = (this.nameOverride ?? '').trim();
    if (override) return override;
    const name = (this.student?.fields?.Name ?? '').trim();
    const surname = (this.student?.fields?.Surname ?? '').trim();
    return `${name} ${surname}`.trim();
  }

  /**
   * Tamaño de fuente para el nombre superior: una sola línea, sin solaparse con el sello.
   * (En la exportación PNG el salto de línea dejaba la 2.ª línea detrás del logo.)
   */
  get topNameFontSizePx(): number {
    const len = this.displayName.length;
    if (len > 78) return 9;
    if (len > 62) return 10;
    if (len > 52) return 11;
    if (len > 42) return 12;
    if (len > 34) return 13;
    if (len > 28) return 14;
    if (len > 22) return 16;
    return 18;
  }

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
