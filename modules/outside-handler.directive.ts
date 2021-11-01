import {
  Directive,
  Input,
  Renderer2,
  OnChanges,
  Output,
  EventEmitter,
  OnDestroy,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { Subscription, fromEventPattern } from 'rxjs';
import { delay } from 'rxjs/operators';

// inspired by https://stackoverflow.com/a/60296925
export function createObservableHandler(
  renderer: Renderer2,
  target = 'window',
  event = 'click',
  delayMs = 0
) {
  let removeClickEventListener: () => void;
  const createClickEventListener = (handler: (e: Event) => boolean | void) => {
    removeClickEventListener = renderer.listen(target, event, handler);
  };
  return fromEventPattern<Event>(createClickEventListener, () =>
    removeClickEventListener()
  ).pipe(delay(delayMs));
}

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[outsideEvent]',
})
export class OutsideHandlerDirective implements OnDestroy, OnChanges {
  @Input() set exclusion(value: string[]) {
    this.excludedClasses = value
      .filter((e) => e.startsWith('.'))
      .map((e) => e.substring(1, e.length));
    this.excludedIds = value
      .filter((e) => e.startsWith('#'))
      .map((e) => e.substring(1, e.length));
    this.excludedElements = value
      .filter((e) => !e.startsWith('#') && !e.startsWith('.'))
      .map((e) => e.toLowerCase());
  }
  @Input() keepInclusionListInsideDirective = true;
  @Input() maxLevelup = 20;
  @Input() delay = 0;
  @Input() target = 'window';
  @Input() event = 'click';
  @Output() outsideEvent = new EventEmitter<HTMLElement>();

  private excludedClasses = [];
  private excludedIds = [];
  private excludedElements = [];
  private subscriptionHandler: Subscription;
  private attachedEvent = false;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !this.attachedEvent ||
      (changes.maxLevelup &&
        changes.maxLevelup.previousValue !== changes.maxLevelup.currentValue) ||
      (changes.target &&
        changes.target.previousValue !== changes.target.currentValue) ||
      (changes.event &&
        changes.event.previousValue !== changes.event.currentValue) ||
      (changes.delay &&
        changes.delay.previousValue !== changes.delay.currentValue)
    ) {
      if (this.subscriptionHandler) {
        this.subscriptionHandler.unsubscribe();
      }
      this.subscriptionHandler = createObservableHandler(
        this.renderer,
        this.target,
        this.event,
        this.delay
      ).subscribe((e) => {
        const path = this.getElementPath(e);
        let target = (e as Event).target as HTMLElement;
        const outsideHandleOutside = this.outsideEvent?.observers.length > 0;
        // if no included elements are provided, every element is included
        // otherwise check if the element or one of the parents matches the inclusion list
        let isIncluded = false;
        let isExcluded = false;

        for (const [index, elementToCheck] of path.entries()) {
          if (index > this.maxLevelup) {
            break;
          }
          if (this.matchesElement(elementToCheck, 'include')) {
            target = elementToCheck;
            isIncluded = true;
            break;
          }
        }
        if (isIncluded) {
          // if the target is in the inclusionlist, of there is no inclusion list, check if the target
          // or the target parent matches a exclusion.
          for (const [index, elementToCheck] of path.entries()) {
            if (index > this.maxLevelup) {
              break;
            }
            if (
              this.matchesElement(elementToCheck, 'exclude') ||
              (outsideHandleOutside &&
                path.find((epath) => epath === this.el?.nativeElement))
            ) {
              isExcluded = true;
              break;
            }
          }
        }
        if (outsideHandleOutside && !isExcluded) {
          this.outsideEvent?.emit(target);
        }
      });
      this.attachedEvent = true;
    }
  }

  private getElementPath(event: Event) {
    const path = (event as any).path;
    if (path) {
      return path;
    } else {
      const composedPath: Array<HTMLElement> = [];
      let index = 0;
      let el = event.target as HTMLElement;
      while (index < this.maxLevelup && !!el) {
        composedPath.push(el);
        el = el.parentNode as HTMLElement;
        index++;
      }
      return composedPath;
    }
  }

  private matchesElement(element: HTMLElement, check: 'include' | 'exclude') {
    const elements = this.excludedElements;
    const ids = this.excludedIds;
    const classes = this.excludedClasses;

    if (element && elements?.includes(element.tagName?.toLowerCase())) {
      return true;
    }
    for (const className of classes) {
      if (element.classList?.contains(className)) {
        return true;
      }
    }
    for (const id of ids) {
      if (element.id === id) {
        return true;
      }
    }
    return false;
  }

  ngOnDestroy() {
    if (this.subscriptionHandler) {
      this.subscriptionHandler.unsubscribe();
    }
  }
}
