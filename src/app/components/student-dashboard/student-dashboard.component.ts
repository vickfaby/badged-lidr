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

      // 2. Convertir Base64 a Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      // 3. Copiar al portapapeles
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      console.log('Imagen copiada al portapapeles. Pégala en el correo.');
      alert('Imagen copiada al portapapeles. Pégala en el correo (Ctrl+V).');

      // 4. Abrir mailto (destinatario, asunto y cuerpo con saludo)
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
      console.error('Error al copiar badge o abrir correo', err);
      alert('Error al generar/copiar la imagen. Revisa la consola.');
    }
  }

  async processBadge(student: AirtableRecord): Promise<void> {
    // Redirigimos al nuevo flujo de copiar y abrir correo
    await this.copyBadgeAndOpenEmail(student);
  }
}
