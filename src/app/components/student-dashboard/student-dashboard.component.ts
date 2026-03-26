import {
  Component,
  computed,
  HostListener,
  OnInit,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { AirtableService } from '../../services/airtable.service';
import { AirtableRecord, AirtableTable } from '../../models/student.model';
import { StudentBadgeComponent } from '../student-badge/student-badge.component';
import { environment } from '../../../environments/environment';

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
  /** Tablas disponibles en la base (cohorts) */
  tables = signal<AirtableTable[]>([]);
  loadingTables = signal(true);
  /** Nombre de la tabla (cohort) actualmente seleccionada */
  selectedTable = signal<string>(environment.airtableTableName);
  /** Texto de búsqueda para filtrar tablas */
  tableSearch = signal<string>('');
  /** Controla si el dropdown de tablas está abierto */
  tableDropdownOpen = signal(false);
  /** Tablas filtradas según el texto de búsqueda */
  filteredTables = computed(() => {
    const q = this.tableSearch().toLowerCase().trim();
    return q ? this.tables().filter(t => t.name.toLowerCase().includes(q)) : this.tables();
  });
  /** IDs de alumnos deshabilitados manualmente por el usuario */
  manuallyDisabled = signal<Set<string>>(new Set());
  /** URLs de foto reemplazadas por el usuario (studentId -> data URL) */
  photoOverrides = signal<Map<string, string>>(new Map());
  /** Nombres reemplazados por el usuario (studentId -> displayName) */
  nameOverrides = signal<Map<string, string>>(new Map());
  /** ID del alumno cuyo nombre se está editando */
  editingNameForId = signal<string | null>(null);
  /** Draft del input de edición de nombre */
  nameDraft = signal<string>('');
  /** Alumno seleccionado para ver preview */
  previewStudent = signal<AirtableRecord | null>(null);

  getStudentDisplayName(student: AirtableRecord): string {
    const override = this.nameOverrides().get(student.id);
    if (override && override.trim()) return override.trim();
    const name = (student.fields.Name ?? '').trim();
    const surname = (student.fields.Surname ?? '').trim();
    return `${name} ${surname}`.trim();
  }

  startEditName(student: AirtableRecord): void {
    this.editingNameForId.set(student.id);
    this.nameDraft.set(this.getStudentDisplayName(student));
  }

  cancelEditName(): void {
    this.editingNameForId.set(null);
    this.nameDraft.set('');
  }

  saveEditName(student: AirtableRecord): void {
    const nextName = this.nameDraft().trim();
    this.nameOverrides.update((m) => {
      const next = new Map(m);
      if (nextName) next.set(student.id, nextName);
      else next.delete(student.id);
      return next;
    });
    this.cancelEditName();
  }

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
    if (this.isBadgeSent(student)) return false;
    if (!student.fields.Pic?.length) return false;
    if (this.manuallyDisabled().has(student.id)) return false;
    return true;
  }

  /**
   * Determina si el badge ya fue enviado.
   * En algunas tablas este estado está en `Sent`; mantenemos compatibilidad con `Badge`.
   */
  isBadgeSent(student: AirtableRecord): boolean {
    const sent = student.fields.Sent;
    if (typeof sent === 'boolean') return sent;
    return student.fields.Badge === true;
  }

  toggleDisable(studentId: string): void {
    const next = new Set(this.manuallyDisabled());
    if (next.has(studentId)) next.delete(studentId);
    else next.add(studentId);
    this.manuallyDisabled.set(next);
  }

  constructor(private airtable: AirtableService) {}

  ngOnInit(): void {
    // Cargar tablas disponibles y luego los alumnos de la tabla seleccionada
    this.airtable.getTables().subscribe({
      next: (tables) => {
        console.log('[Dashboard] Tablas cargadas:', tables.length, tables.map(t => t.name));
        this.tables.set(tables);
        this.loadingTables.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Error al cargar tablas:', err);
        this.loadingTables.set(false);
      },
    });
    this.loadStudents(this.selectedTable());
  }

  /** Carga los alumnos de la tabla indicada y resetea el estado local. */
  loadStudents(tableName: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.students.set([]);
    this.manuallyDisabled.set(new Set());
    this.photoOverrides.set(new Map());
    this.nameOverrides.set(new Map());
    this.cancelEditName();
    this.airtable.getStudents(tableName).subscribe({
      next: (records) => {
        const sorted = [...records].sort((a, b) => {
          const nameA = (a.fields.Name ?? '').trim().toLowerCase();
          const nameB = (b.fields.Name ?? '').trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });
        this.students.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const status = err?.status;
        const message =
          status === 404
            ? 'Tabla no encontrada. Comprueba que la tabla existe y el token tiene acceso.'
            : status === 401
              ? 'Token inválido. Comprueba airtableToken en environment.'
              : 'No se pudieron cargar los alumnos. Comprueba la consola y las credenciales.';
        this.error.set(message);
      },
    });
  }

  /** Selecciona una tabla del dropdown y recarga los alumnos. */
  onTableChange(tableName: string): void {
    this.selectedTable.set(tableName);
    this.tableSearch.set('');
    this.tableDropdownOpen.set(false);
    this.loadStudents(tableName);
  }

  /** Abre/cierra el dropdown y enfoca el input de búsqueda. */
  toggleTableDropdown(): void {
    this.tableDropdownOpen.update(v => !v);
    if (this.tableDropdownOpen()) {
      this.tableSearch.set('');
    }
  }

  /** Cierra el dropdown cuando se hace click fuera. */
  closeTableDropdown(): void {
    this.tableDropdownOpen.set(false);
    this.tableSearch.set('');
  }

  /** Cierra el dropdown al hacer click fuera del combobox. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.tableDropdownOpen()) return;
    const combobox = document.getElementById('table-combobox');
    if (combobox && !combobox.contains(event.target as Node)) {
      this.closeTableDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.previewStudent()) this.closePreview();
    else if (this.editingNameForId()) this.cancelEditName();
    else if (this.tableDropdownOpen()) this.closeTableDropdown();
  }

  openPreview(student: AirtableRecord): void {
    this.previewStudent.set(student);
  }

  closePreview(): void {
    this.previewStudent.set(null);
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
      this.airtable.markBadgeAsSent(student.id, this.selectedTable()).subscribe({
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
