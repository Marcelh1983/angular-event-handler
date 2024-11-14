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
  selector: '[outsideEvent]',
})
export class OutsideHandlerDirective implements OnDestroy, OnChanges {
  @Input() set exclusion(value: string[]) {
    this.excludedClasses = value
      .filter((e) => e.startsWith('.'))
      .map((e) => e.substring(1));
    this.excludedIds = value
      .filter((e) => e.startsWith('#'))
      .map((e) => e.substring(1));
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

  private excludedClasses: string[] = [];
  private excludedIds: string[] = [];
  private excludedElements: string[] = [];
  private subscriptionHandler?: Subscription;
  private attachedEvent = false;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.attachedEvent || this.shouldReattachEvent(changes)) {
      this.subscribeToEvent();
    }
  }

  ngOnDestroy(): void {
    this.subscriptionHandler?.unsubscribe();
  }

  private shouldReattachEvent(changes: SimpleChanges): boolean {
    return ['maxLevelup', 'target', 'event', 'delay'].some(
      (key) =>
        changes[key] && changes[key].previousValue !== changes[key].currentValue
    );
  }

  private subscribeToEvent(): void {
    this.subscriptionHandler?.unsubscribe();
    this.subscriptionHandler = createObservableHandler(
      this.renderer,
      this.target,
      this.event,
      this.delay
    ).subscribe((e) => this.handleOutsideEventCheck(e as Event));
    this.attachedEvent = true;
  }

  private handleOutsideEventCheck(event: Event): void {
    const path = this.getElementPath(event);
    let target = event.target as HTMLElement;
    const isOutsideHandlerActive = this.outsideEvent?.observers.length > 0;
    let isIncluded = false;
    let isExcluded = false;

    isIncluded = path.some(
      (element, index) =>
        index <= this.maxLevelup && this.matchesElement(element, 'include')
    );

    if (isIncluded) {
      isExcluded = path.some(
        (element, index) =>
          index <= this.maxLevelup &&
          (this.matchesElement(element, 'exclude') ||
            (isOutsideHandlerActive && path.includes(this.el.nativeElement)))
      );
    }

    if (isOutsideHandlerActive && !isExcluded) {
      this.outsideEvent.emit(target);
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

  private matchesElement(
    element: HTMLElement,
    check: 'include' | 'exclude'
  ): boolean {
    const elements = this.excludedElements;
    const ids = this.excludedIds;
    const classes = this.excludedClasses;

    return (
      elements.includes(element.tagName?.toLowerCase()) ||
      classes.some((className) => element.classList?.contains(className)) ||
      ids.includes(element.id)
    );
  }
}
