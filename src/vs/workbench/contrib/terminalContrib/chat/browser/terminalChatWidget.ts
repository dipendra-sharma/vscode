/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Widget } from 'vs/base/browser/ui/widget';
import { IContextKey, IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextViewService, IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { ITerminalInstance, IDetachedTerminalInstance } from 'vs/workbench/contrib/terminal/browser/terminal';
import * as dom from 'vs/base/browser/dom';
import { KeyCode } from 'vs/base/common/keyCodes';
import { TerminalContextKeys } from 'vs/workbench/contrib/terminal/common/terminalContextKey';

export class TerminalChatWidget extends Widget {
	private readonly _focusTracker: dom.IFocusTracker;
	private readonly _domNode: HTMLElement;
	private readonly _innerDomNode: HTMLElement;
	private _isVisible: boolean = false;
	private _width: number = 0;
	private _chatWidgetFocused: IContextKey<boolean>;
	private _chatWidgetVisible: IContextKey<boolean>;

	constructor(
		private _instance: ITerminalInstance | IDetachedTerminalInstance,
		@IContextViewService _contextViewService: IContextViewService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextKeyService private readonly _contextKeyService: IContextKeyService,
		@IContextMenuService _contextMenuService: IContextMenuService,
		// @IThemeService private readonly _themeService: IThemeService,
		// @IConfigurationService private readonly _configurationService: IConfigurationService
	) {
		super();

		this._innerDomNode = document.createElement('div');
		this._innerDomNode.classList.add('terminal-chat-widget');
		this._innerDomNode.textContent = 'Chat Widget';

		this._domNode = document.createElement('div');
		this._domNode.classList.add('terminal-chat-widget-wrapper');
		this._domNode.appendChild(this._innerDomNode);

		this.onkeyup(this._innerDomNode, e => {
			if (e.equals(KeyCode.Escape)) {
				this.hide();
				e.preventDefault();
				return;
			}
		});
		this._chatWidgetFocused = TerminalContextKeys.chatFocused.bindTo(this._contextKeyService);
		this._chatWidgetVisible = TerminalContextKeys.chatVisible.bindTo(this._contextKeyService);
		this._focusTracker = this._register(dom.trackFocus(this._innerDomNode));
		this._register(this._focusTracker.onDidFocus(this._onFocusTrackerFocus.bind(this)));
		this._register(this._focusTracker.onDidBlur(this._onFocusTrackerBlur.bind(this)));
	}

	public hide(animated = true): void {
		if (this._isVisible) {
			this._innerDomNode.classList.toggle('suppress-transition', !animated);
			this._innerDomNode.classList.remove('visible-transition');
			this._innerDomNode.setAttribute('aria-hidden', 'true');
			// Need to delay toggling visibility until after Transition, then visibility hidden - removes from tabIndex list
			setTimeout(() => {
				this._isVisible = false;
				this._chatWidgetVisible.reset();
				this._innerDomNode.classList.remove('visible', 'suppress-transition');
			}, animated ? 200 : 0);
		}
	}

	public layout(width: number = this._width): void {
		this._width = width;
	}

	public isVisible(): boolean {
		return this._isVisible;
	}

	public getDomNode() {
		return this._domNode;
	}

	public get focusTracker(): dom.IFocusTracker {
		return this._focusTracker;
	}

	public reveal(animated = true): void {
		if (this._isVisible) {
			return;
		}

		this._isVisible = true;
		this.layout();
		this._chatWidgetVisible.set(true);
		setTimeout(() => {
			this._innerDomNode.classList.toggle('suppress-transition', !animated);
			this._innerDomNode.classList.add('visible', 'visible-transition');
			this._innerDomNode.setAttribute('aria-hidden', 'false');
			this._domNode.style.zIndex = '33 !important';
			this._domNode.textContent = 'Chat Widget';
			if (!animated) {
				setTimeout(() => {
					this._innerDomNode.classList.remove('suppress-transition');
				}, 0);
			}
		}, 0);
	}

	protected _onFocusTrackerFocus() {
		this._chatWidgetFocused.set(true);
	}

	protected _onFocusTrackerBlur() {
		this._instance.xterm?.clearActiveSearchDecoration();
		this._chatWidgetFocused.reset();
	}
}
