import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable, expand, reduce } from 'rxjs';
import { environment } from '../../environments/environment';
import { AirtableRecord, AirtableResponse } from '../models/student.model';

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
  private readonly baseUrl = `https://api.airtable.com/v0/${environment.airtableBaseId}/${encodeURIComponent(environment.airtableTableName)}`;
  private readonly headers = new HttpHeaders({
    Authorization: `Bearer ${environment.airtableToken}`,
  });

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los alumnos (recorre la paginación de Airtable) y retorna
   * el array completo. El orden alfabético se aplica en el componente tras recibir los datos.
   */
  getStudents(): Observable<AirtableRecord[]> {
    return this.fetchPage(this.baseUrl).pipe(
      expand((res) =>
        res.offset
          ? this.fetchPage(`${this.baseUrl}?offset=${res.offset}`)
          : EMPTY
      ),
      reduce((acc: AirtableRecord[], res) => acc.concat(res.records), [])
    );
  }

  private fetchPage(url: string): Observable<AirtableResponse> {
    return this.http.get<AirtableResponse>(url, { headers: this.headers });
  }
}
