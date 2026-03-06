/**
 * Representa un archivo adjunto (p. ej. imagen) devuelto por Airtable.
 */
export interface AirtableAttachment {
  /** URL pública del archivo */
  url: string;
  /** Nombre original del archivo */
  filename: string;
  /** Tipo MIME del archivo */
  type: string;
}

/**
 * Campos de un registro de estudiante en Airtable.
 */
export interface StudentFields {
  /** Nombre del estudiante */
  name: string;
  /** Apellido del estudiante */
  surname: string;
  /** Correo electrónico del estudiante */
  email: string;
  /** Imágenes asociadas (Airtable devuelve las imágenes como array de objetos) */
  pic: AirtableAttachment[];
  /** Indica si se ha enviado la comunicación (control de estado) */
  sent?: boolean;
}

/**
 * Representa un registro individual de la respuesta de Airtable.
 */
export interface AirtableRecord {
  /** Identificador único del registro en Airtable */
  id: string;
  /** Objeto con los campos del registro */
  fields: StudentFields;
}

/**
 * Respuesta completa de la API de Airtable al listar registros.
 */
export interface AirtableResponse {
  /** Array de registros devueltos por Airtable */
  records: AirtableRecord[];
}
