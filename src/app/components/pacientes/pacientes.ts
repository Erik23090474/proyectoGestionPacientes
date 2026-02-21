import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PacientesService } from '../../services/pacientes';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Paciente } from '../../models/paciente.model';
import { EmailFormatPipe } from '../../pipes/email-format-pipe';
import { Observable } from 'rxjs'; // Importamos Observable

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmailFormatPipe],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.css']
})
export class PacientesComponent implements OnInit {
  pacienteForm: FormGroup;
  pacientes: Paciente[] = [];
  editingId: string | null = null;
  user$: Observable<any>; // Tipamos como Observable para evitar el error de 'unknown'
  
  readonly soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private authService: AuthService,
    private router: Router
  ) {
    // Asignación segura dentro del constructor
    this.user$ = this.authService.user$;
    
    this.pacienteForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        Validators.pattern(this.soloLetrasRegex)
      ]],
      apellidos: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200),
        Validators.pattern(this.soloLetrasRegex)
      ]],
      fechaNacimiento: ['', Validators.required],
      domicilio: ['', Validators.required],
      correoElectronico: ['', [
        Validators.required,
        Validators.email
      ]]
    });
  }

  ngOnInit() {
    this.loadPacientes();
  }

  loadPacientes() {
    // Esta función llamará al servicio corregido con query()
    this.pacientesService.getPacientes().subscribe({
      next: (data) => {
        this.pacientes = data;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
      }
    });
  }

  onSubmit() {
    if (this.pacienteForm.valid) {
      const formValue = this.pacienteForm.value;
      const paciente: Paciente = {
        ...formValue,
        // Aseguramos que la fecha sea un objeto Date válido
        fechaNacimiento: new Date(formValue.fechaNacimiento + 'T00:00:00')
      };

      if (this.editingId) {
        this.updatePaciente(paciente);
      } else {
        this.addPaciente(paciente);
      }
    } else {
      this.markFormGroupTouched(this.pacienteForm);
      alert('Por favor, completa todos los campos correctamente');
    }
  }

  addPaciente(paciente: Paciente) {
    this.pacientesService.addPaciente(paciente)
      .then(() => {
        alert('✅ Paciente agregado exitosamente');
        this.resetForm();
      })
      .catch(error => {
        console.error('Error al agregar:', error);
        alert('❌ Error al agregar el paciente');
      });
  }

  updatePaciente(paciente: Paciente) {
    if (this.editingId) {
      this.pacientesService.updatePaciente(this.editingId, paciente)
        .then(() => {
          alert('✅ Paciente actualizado exitosamente');
          this.resetForm();
        })
        .catch(error => {
          console.error('Error al actualizar:', error);
          alert('❌ Error al actualizar');
        });
    }
  }

  editPaciente(paciente: Paciente) {
    this.editingId = paciente.id || null;
    const fechaFormateada = this.formatDateForInput(paciente.fechaNacimiento);
    
    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      apellidos: paciente.apellidos,
      fechaNacimiento: fechaFormateada,
      domicilio: paciente.domicilio,
      correoElectronico: paciente.correoElectronico
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePaciente(id: string | undefined) {
    if (!id) return;
    
    if (confirm('¿Estás seguro de eliminar este paciente?')) {
      this.pacientesService.deletePaciente(id)
        .then(() => {
          alert('✅ Paciente eliminado exitosamente');
        })
        .catch(error => {
          console.error('Error al eliminar:', error);
          alert('❌ Error al eliminar');
        });
    }
  }

  resetForm() {
    this.pacienteForm.reset();
    this.editingId = null;
  }

  formatDateForInput(date: any): string {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    // Para fechas que vienen de Firestore Timestamp
    if (date?.toDate) {
      return date.toDate().toISOString().split('T')[0];
    }
    // Si ya es un string, lo devolvemos tal cual
    if (typeof date === 'string') return date.split('T')[0];
    return '';
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}