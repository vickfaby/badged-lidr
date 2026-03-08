import {
  Component,
  OnInit,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { AirtableService } from '../../services/airtable.service';
import { AirtableRecord } from '../../models/student.model';
import { StudentBadgeComponent } from '../student-badge/student-badge.component';

function isHeic(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [StudentBadgeComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit {
  students = signal<AirtableRecord[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  /** IDs de alumnos deshabilitados manualmente por el usuario */
  manuallyDisabled = signal<Set<string>>(new Set());
  /** URLs de foto reemplazadas por el usuario (studentId -> data URL) */
  photoOverrides = signal<Map<string, string>>(new Map());

  /** Abre el selector de archivo para cambiar la foto del alumno. Soporta HEIC (se convierte a JPEG). */
  editPhoto(student: AirtableRecord): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.heic,.heif,image/heic,image/heif';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const setPhoto = (dataUrl: string) => {
        this.photoOverrides.update((m) => {
          const next = new Map(m);
          next.set(student.id, dataUrl);
          return next;
        });
      };
      if (isHeic(file)) {
        try {
          const heic2any = (await import('heic2any')).default;
          const result = await heic2any({ blob: file, toType: 'image/jpeg' });
          const blob = Array.isArray(result) ? result[0] : result;
          const reader = new FileReader();
          reader.onload = () => setPhoto(reader.result as string);
          reader.readAsDataURL(blob);
        } catch {
          const reader = new FileReader();
          reader.onload = () => setPhoto(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  @ViewChildren(StudentBadgeComponent) badgeComponents!: QueryList<StudentBadgeComponent>;

  canGenerateBadge(student: AirtableRecord): boolean {
    if (student.fields.Badge === true) return false;
    if (!student.fields.Pic?.length) return false;
    if (this.manuallyDisabled().has(student.id)) return false;
    return true;
  }

  toggleDisable(studentId: string): void {
    const next = new Set(this.manuallyDisabled());
    if (next.has(studentId)) next.delete(studentId);
    else next.add(studentId);
    this.manuallyDisabled.set(next);
  }

  constructor(private airtable: AirtableService) {}

  ngOnInit(): void {
    this.airtable.getStudents().subscribe({
      next: (records) => {
        const sorted = [...records].sort((a, b) => {
          const nameA = (a.fields.Name ?? '').trim().toLowerCase();
          const nameB = (b.fields.Name ?? '').trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });
        this.students.set(sorted);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        const status = err?.status;
        const message =
          status === 404
            ? 'Base o tabla no encontrada. Comprueba airtableBaseId y airtableTableName en src/environments/environment.ts'
            : status === 401
              ? 'Token inválido. Comprueba airtableToken en environment.'
              : 'No se pudieron cargar los alumnos. Comprueba la consola y las credenciales.';
        this.error.set(message);
      },
    });
  }

  async copyBadgeAndOpenEmail(student: AirtableRecord): Promise<void> {
    if (!this.canGenerateBadge(student)) return;
    const idx = this.students().findIndex((s) => s.id === student.id);
    const badgeComp = this.badgeComponents?.get(idx);
    if (!badgeComp) {
      console.error('Badge component not found for student', student.id);
      return;
    }
    try {
      // 1. Generar imagen en Base64
      const dataUrl = await badgeComp.generateBadgeImage();

      // 2. Descargar la imagen
      const link = document.createElement('a');
      link.download = `badge-${student.fields.Name}-${student.fields.Surname}.png`;
      link.href = dataUrl;
      link.click();

      // 3. Abrir mailto (destinatario, asunto y cuerpo con saludo)
      const subject = 'Este es tu badge oficial de IA4Devs. 🏅¿Estás listo para iniciar?';
      const body = `Hola ${student.fields.Name},\n\n`;
      const mailto = `mailto:${student.fields.Email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, '_blank');

      // Marcar badge como enviado en Airtable y actualizar estado local
      this.airtable.markBadgeAsSent(student.id).subscribe({
        next: (updated) => {
          this.students.update((list) =>
            list.map((s) => (s.id === updated.id ? updated : s))
          );
        },
        error: (err) => {
          console.error('Error al actualizar Airtable (marcar badge enviado)', err);
          alert('El correo se abrió correctamente, pero no se pudo marcar el badge como enviado en la base de datos. Puedes intentar de nuevo más tarde.');
        },
      });
    } catch (err) {
      console.error('Error al generar/descargar badge o abrir correo', err);
      alert('Error al generar o descargar la imagen. Revisa la consola.');
    }
  }

  async processBadge(student: AirtableRecord): Promise<void> {
    // Redirigimos al nuevo flujo de copiar y abrir correo
    await this.copyBadgeAndOpenEmail(student);
  }
}
