import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private firestore: Firestore = inject(Firestore);

  // LISTAR: Obtiene datos en tiempo real y convierte Timestamps a Date
  getPacientes(): Observable<Paciente[]> {
    return new Observable<Paciente[]>((subscriber) => {
      const colRef = collection(this.firestore, 'pacientes');
      const q = query(colRef);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const pacientes = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            fechaNacimiento: data.fechaNacimiento?.toDate 
              ? data.fechaNacimiento.toDate() 
              : data.fechaNacimiento
          } as Paciente;
        });
        subscriber.next(pacientes);
      }, (error) => subscriber.error(error));

      return () => unsubscribe();
    });
  }

  // AGREGAR
  addPaciente(paciente: Paciente): Promise<any> {
    const colRef = collection(this.firestore, 'pacientes');
    const { id, ...data } = paciente; 
    return addDoc(colRef, data);
  }

  // ACTUALIZAR
  updatePaciente(id: string, paciente: Partial<Paciente>): Promise<void> {
    const docRef = doc(this.firestore, 'pacientes', id);
    const { id: _, ...data } = paciente;
    return updateDoc(docRef, data);
  }

  // ELIMINAR
  deletePaciente(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'pacientes', id);
    return deleteDoc(docRef);
  }
}