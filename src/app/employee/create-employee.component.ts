import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl, FormArray } from '@angular/forms';
import {CustomValidators } from '../shared/custom.validators';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from './employee.service';
import { IEmployee } from './IEmployee';
import { ISkill } from './ISkill';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent implements OnInit {
  employeeForm: FormGroup;
  employee: IEmployee;
  pageTitle: string;

  validationMessages = {
    'fullName': {
      'required': 'Full Name is required.',
      'minlength': 'Full Name must be greater than 2 characters.',
      'maxlength': 'Full Name must be less than 22 characters.',
    },
    'email': {
      'required': 'Email is required.',
      'emailDomain': 'Email domian should be dell.com'
    },
    'confirmEmail': {
      'required': 'Confirm Email is required.',
    },
    'emailGroup' : {
      'emailMismatch': 'Email and Confirm Email do not match',
    },
    'phone': {
      'required': 'Phone is required.'
    },
  };

  formErrors = {
  };

  constructor(private fb:FormBuilder, 
              private route:ActivatedRoute,
              private employeeService:EmployeeService,
              private router: Router) { }

  ngOnInit() {

    this.employeeForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      contactPreference: ['email'],
      emailGroup:this.fb.group({
        email: ['', [Validators.required, CustomValidators.emailDomain('dell.com')]],
        confirmEmail : ['',Validators.required],
      }, {validators : matchEmail}),
      phone: [''],
      skills: this.fb.array([
        this.addSkillFormGroup()
      ])
        
      
    });

    this.employeeForm.get('contactPreference').valueChanges.subscribe((data: string) => {
     this.onContactPrefernceChange(data);
     });

  // When any of the form control value in employee form changes
  // our validation function logValidationErrors() is called
  this.employeeForm.valueChanges.subscribe((data) => {
    this.logValidationErrors(this.employeeForm);
  });

  this.route.paramMap.subscribe(params => {
    const empId= +params.get('id');
    if (empId) {
      this.pageTitle = 'Edit Employee';
      this.getEmployee(empId);
    }else {
      this.pageTitle = 'Create Employee';
      this.employee = {
        id: null,
        fullName: '',
        contactPreference: '',
        email: '',
        phone: null,
        skills: []
      };
    }
  });

} 


getEmployee(id: number){
  this.employeeService.getEmployee(id).subscribe(
  (employee: IEmployee) => {this.editEmployee(employee)
                             this.employee = employee;
  },
  (err: any) => console.log(err)
  );
}

editEmployee(employee: IEmployee) {
  this.employeeForm.patchValue({
    fullName: employee.fullName,
    contactPreference: employee.contactPreference,
    emailGroup: {
      email: employee.email,
      confirmEmail: employee.email
    },
    phone: employee.phone
  });

  this.employeeForm.setControl('skills', this.setExistingSkills(employee.skills));
}

setExistingSkills(skillSets: ISkill[]): FormArray {
  const formArray = new FormArray([]);
  skillSets.forEach(s => {
    formArray.push(this.fb.group({
      skillName: s.skillName,
      experienceInYears: s.experienceInYears,
      proficiency: s.proficiency
    }));
  });

  return formArray;
}

addSkillButtonClick(): void {
  (<FormArray>this.employeeForm.get('skills')).push(this.addSkillFormGroup());
}

removeSkillButtonClick(skillGroupIndex: number): void {
  const skillsFormArray = <FormArray>this.employeeForm.get('skills');
  skillsFormArray.removeAt(skillGroupIndex);
  skillsFormArray.markAsDirty();
  skillsFormArray.markAsTouched();
}

addSkillFormGroup(): FormGroup {
return this.fb.group({
  skillName: ['', Validators.required],
  experienceInYears: ['', Validators.required],
  proficiency: ['', Validators.required]
});
}

onContactPrefernceChange(selectedValue: string) {
  const phoneFormControl = this.employeeForm.get('phone');
  if (selectedValue === 'phone') {
    phoneFormControl.setValidators(Validators.required);
  } else {
    phoneFormControl.clearValidators();
  }
  phoneFormControl.updateValueAndValidity();
}

  
logValidationErrors(group: FormGroup = this.employeeForm): void {
  Object.keys(group.controls).forEach((key: string) => {
    const abstractControl = group.get(key);

    this.formErrors[key] = '';
    // abstractControl.value !== '' (This condition ensures if there is a value in the
    // form control and it is not valid, then display the validation error)
    if (abstractControl && !abstractControl.valid &&
        (abstractControl.touched || abstractControl.dirty || abstractControl.value !== '')) {
      const messages = this.validationMessages[key];

      for (const errorKey in abstractControl.errors) {
        if (errorKey) {
          this.formErrors[key] += messages[errorKey] + ' ';
        }
      }
    }

    if (abstractControl instanceof FormGroup) {
      this.logValidationErrors(abstractControl);
    }
  });
}

  onLoadDataClick(): void {
   // this.logValidationErrors(this.employeeForm);
  //  console.log(this.formErrors);
  const formArray = new FormArray([
    new FormControl('john', Validators.required),
    new FormGroup({
      country: new FormControl('', Validators.required)
    }),
    new FormArray([])
  ]);
  console.log(formArray.length);

  for (const control of formArray.controls){
    if (control instanceof FormControl){
      console.log('Control is FormControl');
    }
    if (control instanceof FormGroup){
      console.log('Control is FormGroup');
    }
    if (control instanceof FormArray){
      console.log('Control is FormArray');
      
    }
  }
  }

 
  

  onSubmit(): void {
   // console.log(this.employeeForm.touched);
    //console.log(this.employeeForm.value);
//
  //  console.log(this.employeeForm.controls.fullName.touched);
    //console.log(this.employeeForm.get('fullName').value);
    this.mapFormValuesToEmployeeModel();

  if (this.employee.id) {
    this.employeeService.updateEmployee(this.employee).subscribe(
      () => this.router.navigate(['list']),
      (err: any) => console.log(err)
    );
  } else {
    this.employeeService.addEmployee(this.employee).subscribe(
      () => this.router.navigate(['list']),
      (err: any) => console.log(err)
    );
  }
}

  mapFormValuesToEmployeeModel() {
    this.employee.fullName = this.employeeForm.value.fullName;
    this.employee.contactPreference = this.employeeForm.value.contactPreference;
    this.employee.email = this.employeeForm.value.emailGroup.email;
    this.employee.phone = this.employeeForm.value.phone;
    this.employee.skills = this.employeeForm.value.skills;
  }
}


function matchEmail(group: AbstractControl): { [key: string]: any } | null {
  const emailControl = group.get('email');
  const confirmEmailControl = group.get('confirmEmail');
  // If confirm email control value is not an empty string, and if the value
  // does not match with email control value, then the validation fails
  if (emailControl.value === confirmEmailControl.value
    || (confirmEmailControl.pristine && confirmEmailControl.value === '')) {
    return null;
  } else {
    return { 'emailMismatch': true };
  }
}

