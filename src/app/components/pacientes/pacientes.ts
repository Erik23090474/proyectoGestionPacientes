import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PacientesService } from '../../services/pacientes';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Paciente } from '../../models/paciente.model';
import { EmailFormatPipe } from '../../pipes/email-format-pipe';
import { Observable } from 'rxjs';
import { take } from 'rxjs';

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
  user$: Observable<any>;
  readonly soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.user$ = this.authService.user$;
    this.pacienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.soloLetrasRegex)]],
      apellidos: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.soloLetrasRegex)]],
      fechaNacimiento: ['', Validators.required],
      domicilio: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.loadPacientes();
  }

  loadPacientes() {
    this.pacientesService.getPacientes().subscribe({
      next: (data: Paciente[]) => {
        this.pacientes = data;
        this.cdr.detectChanges(); // Vital para onSnapshot
      },
      error: (error) => console.error('Error:', error)
    });
  }

onSubmit() {
  if (this.pacienteForm.valid) {
    const formValue = this.pacienteForm.value;

    // Obtenemos el usuario actual de forma segura para extraer su UID [cite: 15, 18]
    this.authService.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        const paciente: Paciente = {
          ...formValue,
          fechaNacimiento: new Date(formValue.fechaNacimiento + 'T00:00:00'),
          ownerId: user.uid // <-- Aquí guardamos el UID del usuario logueado 
        };

        this.editingId ? this.updatePaciente(paciente) : this.addPaciente(paciente);
      }
    });
  } else {
    this.markFormGroupTouched(this.pacienteForm);
    alert('⚠️ Por favor, completa todos los campos correctamente.');
  }
}

  addPaciente(paciente: Paciente) {
    this.pacientesService.addPaciente(paciente)
      .then(() => {
        alert('✅ Paciente agregado exitosamente');
        this.resetForm();
      })
      .catch(() => alert('❌ Error al guardar'));
  }

  updatePaciente(paciente: Paciente) {
    if (this.editingId) {
      this.pacientesService.updatePaciente(this.editingId, paciente)
        .then(() => {
          alert('✅ Información actualizada');
          this.resetForm();
        })
        .catch(() => alert('❌ Error al actualizar'));
    }
  }

  editPaciente(paciente: Paciente) {
    this.editingId = paciente.id || null;
    this.pacienteForm.patchValue({
      ...paciente,
      fechaNacimiento: this.formatDateForInput(paciente.fechaNacimiento)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePaciente(id: string | undefined) {
    if (id && confirm('¿Estás seguro de eliminar este registro?')) {
      this.pacientesService.deletePaciente(id)
        .then(() => alert('🗑️ Registro eliminado'))
        .catch(() => alert('❌ Error al eliminar'));
    }
  }

  resetForm() {
    this.pacienteForm.reset();
    this.editingId = null;
  }

  formatDateForInput(date: any): string {
    if (!date) return '';
    const d = (date instanceof Date) ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => control.markAsTouched());
  }

  logout() {
    this.authService.logout().then(() => this.router.navigate(['/login']));
  }
}