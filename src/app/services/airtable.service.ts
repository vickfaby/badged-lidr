import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { environment } from '../../environments/environment';
import { AirtableRecord, AirtableResponse, AirtableTable, AirtableTablesResponse } from '../models/student.model';

/**
 * Servicio para consumir la API de Airtable.
 *
 * Importante: Airtable limita a 5 peticiones por segundo. Para listar alumnos
 * (una sola petición GET) no hay problema; si en el futuro se hacen muchas
 * peticiones seguidas (p. ej. actualizaciones en lote), conviene usar colas o
 * throttling para no superar el límite.
 */
@Injectable({
  providedIn: 'root',
})
export class AirtableService {
  private readonly baseId = environment.airtableBaseId;
  private readonly headers = new HttpHeaders({
    Authorization: `Bearer ${environment.airtableToken}`,
  });

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las tablas de alumnos disponibles en la base usando la API de Metadatos de Airtable.
   * Solo devuelve las tablas cuyo nombre empieza por "Students" para excluir
   * plantillas, tareas y otras tablas auxiliares.
   * Requiere que el token tenga el scope `schema.bases:read`.
   */
  getTables(): Observable<AirtableTable[]> {
    const url = `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables`;
    return this.http
      .get<AirtableTablesResponse>(url, { headers: this.headers })
      .pipe(map((res) => res.tables.filter((t) => t.name.startsWith('Students'))));
  }

  /**
   * Obtiene todos los alumnos de la tabla indicada (recorre la paginación de Airtable).
   * Si no se especifica tableName, se usa el valor por defecto del entorno.
   */
  getStudents(tableName?: string): Observable<AirtableRecord[]> {
    const table = tableName ?? environment.airtableTableName;
    const baseUrl = this.tableUrl(table);
    return this.fetchPage(baseUrl).pipe(
      expand((res) =>
        res.offset
          ? this.fetchPage(`${baseUrl}?offset=${res.offset}`)
          : EMPTY
      ),
      reduce((acc: AirtableRecord[], res) => acc.concat(res.records), [])
    );
  }

  /**
   * Marca el badge como enviado para un registro. Realiza PATCH y retorna el registro actualizado.
   */
  markBadgeAsSent(recordId: string, tableName?: string): Observable<AirtableRecord> {
    const table = tableName ?? environment.airtableTableName;
    const url = `${this.tableUrl(table)}/${recordId}`;
    return this.http.patch<AirtableRecord>(url, { fields: { Badge: true } }, { headers: this.headers });
  }

  private tableUrl(tableName: string): string {
    return `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(tableName)}`;
  }

  private fetchPage(url: string): Observable<AirtableResponse> {
    return this.http.get<AirtableResponse>(url, { headers: this.headers });
  }
}
