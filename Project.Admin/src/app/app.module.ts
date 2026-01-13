import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { NgModule } from '@angular/core';

const icons: IconDefinition[] = Object.values(AllIcons);

@NgModule({
  providers: [
    { provide: NZ_ICONS, useValue: icons }
  ]
})
export class AppModule {}