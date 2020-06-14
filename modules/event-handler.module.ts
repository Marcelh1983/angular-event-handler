import { NgModule } from "@angular/core";
import { EventHandlerDirective } from './event-handler.directive';


@NgModule({
  declarations: [EventHandlerDirective],
  exports: [EventHandlerDirective]
})
export class NgxEventHandlerModule {}