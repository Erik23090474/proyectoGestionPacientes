import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  collectionData,
  doc, 
  updateDoc, 
  deleteDoc, 
  query // Asegúrate de que query esté importado
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private pacientesCollection;

  constructor(private firestore: Firestore) {
    // Definimos la referencia a la colección una sola vez
    this.pacientesCollection = collection(this.firestore, 'pacientes');
  }

  getPacientes(): Observable<Paciente[]> {
    // 1. CREAR LA CONSULTA: Transformamos la referencia en un objeto tipo Query
    const q = query(this.pacientesCollection); 
    
    // 2. PASAR LA CONSULTA: Usamos 'q' en lugar de la referencia directa
    return collectionData(q, { idField: 'id' }) as Observable<Paciente[]>;
  }

  addPaciente(paciente: Paciente): Promise<any> {
    return addDoc(this.pacientesCollection, paciente);
  }

  updatePaciente(id: string, paciente: Partial<Paciente>): Promise<void> {
    const pacienteDoc = doc(this.firestore, `pacientes/${id}`);
    return updateDoc(pacienteDoc, paciente);
  }

  deletePaciente(id: string): Promise<void> {
    const pacienteDoc = doc(this.firestore, `pacientes/${id}`);
    return deleteDoc(pacienteDoc);
  }
}