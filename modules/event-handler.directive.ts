import {
    Directive, Input, Renderer2,
    OnChanges, Output, EventEmitter, OnDestroy, SimpleChanges, ElementRef
} from '@angular/core';
import { Subscription, fromEventPattern } from 'rxjs';
import { delay } from 'rxjs/operators';

// inspired by https://stackoverflow.com/a/60296925
export function createObservableHandler(renderer: Renderer2, target = 'window', event = 'click', delayMs = 0) {
    let removeClickEventListener: () => void;
    const createClickEventListener = (
        handler: (e: Event) => boolean | void
    ) => {
        removeClickEventListener = renderer.listen(target, event, handler);
    };
    return fromEventPattern<Event>(createClickEventListener, () =>
        removeClickEventListener()
    ).pipe(
        delay(delayMs)
    );
}

@Directive({
    selector: '[handleEvent]'
})
export class EventHandlerDirective implements OnDestroy, OnChanges {
    @Input() set exclusion(value: string[]) {
        this.checkExclude = value?.length > 0;
        this.excludedClasses = value
            .filter(e => e.startsWith('.'))
            .map(e => e.substring(1, e.length));
        this.excludedIds = value
            .filter(e => e.startsWith('#'))
            .map(e => e.substring(1, e.length));
        this.excludedElements = value
            .filter(e => !e.startsWith('#') && !e.startsWith('.'))
            .map(e => e.toLowerCase());
    }
    @Input() set inclusion(value: string[]) {
        this.checkInclude = value?.length > 0;
        this.includedClasses = value
            .filter(e => e.startsWith('.'))
            .map(e => e.substring(1, e.length));
        this.includedIds = value
            .filter(e => e.startsWith('#'))
            .map(e => e.substring(1, e.length));
        this.includedElements = value
            .filter(e => !e.startsWith('#') && !e.startsWith('.'))
            .map(e => e.toLowerCase());
    }
    @Input() keepInclusionListInsideDirective = true;
    @Input() maxLevelup = 20;
    @Input() delay = 0;
    @Input() preventDefault = false;

    @Input() target = 'window';
    @Input() event = 'click';
    @Output() handleEvent = new EventEmitter<HTMLElement>();

    private excludedClasses = [];
    private excludedIds = [];
    private excludedElements = [];
    private includedClasses = [];
    private includedIds = [];
    private includedElements = [];
    private checkInclude = false;
    private checkExclude = false;
    private subscriptionHandler: Subscription;
    private attachedEvent = false;

    constructor(private renderer: Renderer2, private el: ElementRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.attachedEvent || (changes.maxLevelup && changes.maxLevelup.previousValue !== changes.maxLevelup.currentValue) ||
            (changes.target && changes.target.previousValue !== changes.target.currentValue) ||
            (changes.event && changes.event.previousValue !== changes.event.currentValue) ||
            (changes.delay && changes.delay.previousValue !== changes.delay.currentValue)) {
            if (this.subscriptionHandler) {
                this.subscriptionHandler.unsubscribe();
            }
            this.subscriptionHandler = createObservableHandler(this.renderer, this.target, this.event, this.delay).subscribe((e) => {
                // keep InclusionsListInside directive;
                const path = this.getElementPath(e);
                if (!this.keepInclusionListInsideDirective ||
                    !this.checkInclude ||
                    !!path.find(e => e === this.el?.nativeElement)) {
                    // if no included elements are provided, every element is included
                    // otherwise check if the element or one of the parents matches the inclusion list
                    let isIncluded = !this.checkInclude;
                    let isExcluded = false;
                    if (this.checkInclude) {
                        for (const [index, elementToCheck] of path.entries()) {
                            if (index > this.maxLevelup) {
                                break;
                            }
                            if (this.matchesElement(elementToCheck, 'include')) {
                                isIncluded = true;
                                break;
                            }
                        }
                    }
                    if (isIncluded) {
                        // if the target is in the inclusionlist, of there is no inclusion list, check if the target
                        // or the target parent matches a exclusion.
                        for (const [index, elementToCheck] of path.entries()) {
                            if (index > this.maxLevelup) {
                                break;
                            }
                            if (this.matchesElement(elementToCheck, 'exclude')) {
                                isExcluded = true;
                                break;
                            }
                        }
                    }
                    if (isIncluded && !isExcluded) {
                        if (this.preventDefault) {
                            e.preventDefault();
                        }
                        this.handleEvent.emit((e as Event).target as HTMLElement);
                    }
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
        const elements = check === 'exclude' ? this.excludedElements : this.includedElements;
        const ids = check === 'exclude' ? this.excludedIds : this.includedIds;
        const classes = check === 'exclude' ? this.excludedClasses : this.includedClasses;

        if (elements?.includes(element.tagName?.toLowerCase())) {
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
    }

    ngOnDestroy() {
        if (this.subscriptionHandler) {
            this.subscriptionHandler.unsubscribe();
        }
    }

}

