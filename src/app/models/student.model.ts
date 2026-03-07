/**
 * Representa un archivo adjunto (p. ej. imagen) devuelto por Airtable.
 */
export interface AirtableAttachment {
  /** ID del adjunto en Airtable */
  id?: string;
  /** Ancho en píxeles */
  width?: number;
  /** Alto en píxeles */
  height?: number;
  /** URL del archivo */
  url: string;
  /** Nombre original del archivo */
  filename: string;
  /** Tamaño en bytes */
  size?: number;
  /** Tipo MIME del archivo */
  type: string;
  /** URLs de miniaturas (small, large, full) */
  thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
}

/**
 * Campos de un registro de estudiante en Airtable.
 * Los nombres de propiedad coinciden con los de la API (tal como están en la base).
 */
export interface StudentFields {
  /** Nombre del estudiante */
  Name: string;
  /** Apellido del estudiante */
  Surname: string;
  /** Correo electrónico del estudiante */
  Email: string;
  /** Imágenes asociadas (Airtable devuelve las imágenes como array de objetos). Opcional: no todos los registros tienen foto. */
  Pic?: AirtableAttachment[];
  /** Indica si se ha enviado la comunicación (control de estado) */
  Sent?: boolean;
  /** true = badge ya enviado al estudiante (no generar); false = aún no enviado (puede generar) */
  Badge?: boolean;
}

/**
 * Representa un registro individual de la respuesta de Airtable.
 */
export interface AirtableRecord {
  /** Identificador único del registro en Airtable */
  id: string;
  /** Fecha de creación del registro (opcional, la devuelve la API) */
  createdTime?: string;
  /** Objeto con los campos del registro */
  fields: StudentFields;
}

/**
 * Respuesta completa de la API de Airtable al listar registros.
 */
export interface AirtableResponse {
  /** Array de registros devueltos por Airtable */
  records: AirtableRecord[];
  /** Presente cuando hay más registros; usar en la siguiente petición como ?offset=... */
  offset?: string;
}
