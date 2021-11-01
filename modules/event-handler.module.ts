import { NgModule } from "@angular/core";
import { EventHandlerDirective } from './event-handler.directive';
import { OutsideHandlerDirective } from "./outside-handler.directive";


@NgModule({
  declarations: [EventHandlerDirective, OutsideHandlerDirective],
  exports: [EventHandlerDirective, OutsideHandlerDirective]
})
export class NgxEventHandlerModule {}