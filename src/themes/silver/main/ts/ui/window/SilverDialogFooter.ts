/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import {
  Behaviour,
  Container,
  DomFactory,
  Memento,
  MementoRecord,
  ModalDialog,
  Reflecting,
  SketchSpec,
  AlloyComponent,
} from '@ephox/alloy';
import { Types } from '@ephox/bridge';
import { Arr, Option } from '@ephox/katamari';

import { UiFactoryBackstageProviders } from '../../backstage/Backstage';
import { renderFooterButton } from '../general/Button';
import { footerChannel } from './DialogChannels';

// FIX spelling and import location
export interface DialogMemButton {
  name: Types.Dialog.DialogButton['name'];
  align: Types.Dialog.DialogButton['align'];
  memento: MementoRecord;
}

export interface WindowFooterFoo {
  buttons: Types.Dialog.DialogButton[];
}

const makeButton = (button: Types.Dialog.DialogButton, providersBackstage: UiFactoryBackstageProviders) => {
  return renderFooterButton(button, button.type, providersBackstage);
};

const lookup = (compInSystem: AlloyComponent, footerButtons: DialogMemButton[], buttonName: string) => {
  return Arr.find(footerButtons, (button) => {
    return button.name === buttonName;
  }).bind((memButton) => {
    return memButton.memento.getOpt(compInSystem);
  });
};

const renderComponents = (_data, state) => {
  // default group is 'end'
  const footerButtons = state.map((s) => s.footerButtons).getOr([ ]);
  const buttonGroups = Arr.partition(footerButtons, (button) => button.align === 'start');

  const makeGroup = (edge, buttons): SketchSpec => Container.sketch({
    dom: {
      tag: 'div',
      classes: [ `tox-dialog__footer-${edge}` ]
    },
    components: Arr.map(buttons, (button) => button.memento.asSpec())
  });

  const startButtons = makeGroup('start', buttonGroups.pass);
  const endButtons = makeGroup('end', buttonGroups.fail);
  return [ startButtons, endButtons ];
};

const renderFooter = (initFoo: WindowFooterFoo, providersBackstage: UiFactoryBackstageProviders) => {
  const updateState = (_comp, data: WindowFooterFoo) => {
    const footerButtons: DialogMemButton[] = Arr.map(data.buttons, (button) => {
      const memButton = Memento.record(makeButton(button, providersBackstage));
      return {
        name: button.name,
        align: button.align,
        memento: memButton
      };
    });

    const lookupByName = (
      compInSystem: AlloyComponent,
      buttonName: string
    ) => lookup(compInSystem, footerButtons, buttonName);

    return Option.some({
      lookupByName,
      footerButtons
    });
  };

  return {
    dom: DomFactory.fromHtml(`<div class="tox-dialog__footer"></div>`),
    components: [ ],
    behaviours: Behaviour.derive([
      Reflecting.config({
        channel: footerChannel,
        initialData: initFoo,
        updateState,
        renderComponents
      })
    ])
  };
};

const renderInlineFooter = (initFoo: WindowFooterFoo, providersBackstage: UiFactoryBackstageProviders) => {
  return renderFooter(initFoo, providersBackstage);
};

const renderModalFooter = (initFoo: WindowFooterFoo, providersBackstage: UiFactoryBackstageProviders) => {
  return ModalDialog.parts().footer(
    renderFooter(initFoo, providersBackstage)
  );
};

export {
  renderInlineFooter,
  renderModalFooter
};