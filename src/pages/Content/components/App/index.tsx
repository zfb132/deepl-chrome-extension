import clsx from 'clsx'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Draggable, { DraggableEventHandler } from 'react-draggable'
import cc from 'chrome-call'
// @ts-ignore
import ScrollToBottom from 'react-scroll-to-bottom'
import { SnackbarProvider } from 'notistack'

import logger from '../../../../common/logger'
import { Config } from '../../../../common/types'
import IconButton from '../../../../components/IconButton'
import CloseIcon from '../../../../components/svg/Close'
import translationStack from '../../common/translation-stack'
import { TranslateJob } from '../../common/types'
import { ConfigContext, ConfigState } from '../../providers/config'
import { useTranslateJobsDispatch } from '../../providers/translate-jobs'
import TranslationList from '../TranslationList'

const App: React.FC = () => {
  const [config, setConfig] = useState<ConfigState>()
  const [close, setClose] = useState(false)
  const dispatch = useTranslateJobsDispatch()

  const appPosition = useMemo(() => {
    const vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0,
    )
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0,
    )

    return {
      x: vw - 450 - 20,
      y: vh - 600 - 20,
    }
  }, [])

  const onNewJob = useCallback(
    (job: TranslateJob) => {
      logger.debug({
        msg: 'new job',
        job,
      })

      if (!job.sourceLang) {
        job.sourceLang = 'EN'
      }

      dispatch({
        type: 'add',
        payload: job,
      })
    },
    [dispatch],
  )

  const onDragStart: DraggableEventHandler = (e) => {
    if (
      document
        .querySelector<HTMLButtonElement>('.ate_App__close-button')
        ?.contains(e.target as Node)
    ) {
      return false
    }
  }

  useEffect(() => {
    translationStack.attachQueue(onNewJob)

    return () => {
      translationStack.detachQueue()
    }
  }, [onNewJob])

  useEffect(() => {
    cc(chrome.storage.sync, 'get').then((config: Config) => {
      setConfig({
        targetLang: config.targetLang,
      })
    })

    window.__ate_setClose = setClose
  }, [])

  return (
    <ConfigContext.Provider value={config}>
      <Draggable
        handle=".ate_App__header"
        onStart={onDragStart}
        defaultPosition={appPosition}>
        <div className={clsx(['ate_App', close && 'ate_App--inactive'])}>
          <SnackbarProvider
            maxSnack={3}
            domRoot={document.querySelector('.ate_App') as HTMLDivElement}>
            <div className="ate_App__header">
              <span>A Translator</span>
              <span>
                <IconButton
                  className="ate_App__close-button"
                  onClick={() => setClose(true)}>
                  <CloseIcon />
                </IconButton>
              </span>
            </div>
            <ScrollToBottom className="ate_App__container" debug={false}>
              <TranslationList />
            </ScrollToBottom>
          </SnackbarProvider>
        </div>
      </Draggable>
    </ConfigContext.Provider>
  )
}

export default App

declare global {
  interface Window {
    __ate_setClose?: React.Dispatch<any>
  }
}