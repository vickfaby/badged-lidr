import {
  Component,
  computed,
  HostListener,
  OnInit,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { AirtableService } from '../../services/airtable.service';
import { AirtableRecord, AirtableTable } from '../../models/student.model';
import { StudentBadgeComponent } from '../student-badge/student-badge.component';
import { environment } from '../../../environments/environment';

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
  /** Alumno seleccionado para encuadrar su foto */
  cropStudent = signal<AirtableRecord | null>(null);
  /** URL de la foto a encuadrar */
  cropImageUrl = signal<string | null>(null);
  cropLoading = signal(false);
  private cropper: Cropper | null = null;

  /** Estadísticas del cohort actual */
  badgeStats = computed(() => {
    const all = this.students();
    const disabled = this.manuallyDisabled();
    const total = all.length;
    const sent = all.filter(s => this.isBadgeSent(s)).length;
    const available = all.filter(s => this.canGenerateBadge(s)).length;
    const unavailable = total - sent - available;
    return { total, sent, available, unavailable };
  });

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

  /** Descarga la fotografía del alumno (override local o URL de Airtable). */
  async downloadPhoto(student: AirtableRecord): Promise<void> {
    const override = this.photoOverrides().get(student.id);
    const name = this.getStudentDisplayName(student).replace(/\s+/g, '_') || student.id;
    const filename = `foto-${name}.jpg`;

    if (override) {
      // Ya es un data URL → descarga directa
      const link = document.createElement('a');
      link.href = override;
      link.download = filename;
      link.click();
      return;
    }

    // Obtener URL de Airtable (prefiere thumbnail large para evitar HEIC)
    const url = this.getBestAirtablePhotoUrl(student);
    if (!url) return;

    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch {
      // Fallback: abrir en nueva pestaña
      window.open(url, '_blank');
    }
  }

  /** Devuelve la mejor URL de Airtable para trabajar la foto. */
  private getBestAirtablePhotoUrl(student: AirtableRecord): string | null {
    const pic = student.fields.Pic?.[0];
    if (!pic) return null;
    return pic.thumbnails?.['full']?.url ?? pic.thumbnails?.['large']?.url ?? pic.thumbnails?.['small']?.url ?? pic.url;
  }

  /** Abre modal para encuadrar la foto del alumno. */
  editPhoto(student: AirtableRecord): void {
    const source = this.getBestAirtablePhotoUrl(student) ?? this.photoOverrides().get(student.id) ?? null;
    if (!source) return;
    this.destroyCropper();
    this.cropStudent.set(student);
    this.cropImageUrl.set(source);
    this.cropLoading.set(true);
  }

  onCropImageLoaded(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    this.cropLoading.set(false);
    this.destroyCropper();
    this.cropper = new Cropper(img, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.75,
      guides: false,
      center: false,
      highlight: false,
      background: false,
      movable: true,
      zoomable: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      responsive: true,
      checkOrientation: false,
    });
  }

  closeCropModal(): void {
    this.destroyCropper();
    this.cropLoading.set(false);
    this.cropStudent.set(null);
    this.cropImageUrl.set(null);
  }

  applyCrop(): void {
    const student = this.cropStudent();
    if (!student || !this.cropper) return;
    const canvas = this.cropper.getCroppedCanvas({
      width: 1200,
      height: 1200,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    this.photoOverrides.update((m) => {
      const next = new Map(m);
      next.set(student.id, dataUrl);
      return next;
    });
    this.closeCropModal();
  }

  private destroyCropper(): void {
    if (!this.cropper) return;
    this.cropper.destroy();
    this.cropper = null;
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
    this.closeCropModal();
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
    if (this.cropStudent()) this.closeCropModal();
    else if (this.previewStudent()) this.closePreview();
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
