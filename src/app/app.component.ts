import { Component } from '@angular/core';
import { QueryBuilderComponent } from './query-builder/query-builder.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [QueryBuilderComponent],
  template: '<app-query-builder></app-query-builder>',
})
export class AppComponent {}
