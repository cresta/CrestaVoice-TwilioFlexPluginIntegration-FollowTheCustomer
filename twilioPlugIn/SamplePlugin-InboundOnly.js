import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';

import CustomTaskList from './components/CustomTaskList/CustomTaskList'; // for sample component only

const PLUGIN_NAME = 'SamplePlugin';

export default class SamplePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */

  async init(flex, manager) {

    // This code makes a call to backend Twilio Functions to enable/disable a Twilio Media Stream for inbound voice calls.

    // Reservation Created Event
    manager.workerClient.on("reservationCreated", (reservation) => { 

      console.log(`Call SID in reservation.task.attributes: ${'call_sid' in reservation.task.attributes}`)
      console.log(`Task Direction: ${reservation.task.attributes.direction}`)
      console.log(`Reservation details: ${JSON.stringify(reservation.task.attributes)}`)
      console.log(`Reservation Worker SID: ${reservation.workerSid}`)
      console.log(`Worker Name: ${manager.workerClient.name}`)

      // Check if voice call and direction is inbound

      if ('call_sid' in reservation.task.attributes && reservation.task.attributes.direction === 'inbound') {

        // ** On Action of worker accepting Flex Task start the media stream **
        reservation.on("accepted", (reservation) => {
          console.log('*** RESERVATION ACCEPTED ***')
          console.log('**** CALLING FETCH TO START MEDIA STREAM ****')
          const body = {
            agentId: manager.workerClient.name,
            callId: reservation.task.attributes.call_sid,
            Token: manager.store.getState().flex.session.ssoTokenPayload.token
          };
      
          const options = {
            method: 'POST',
            body: new URLSearchParams(body),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
          };
          fetch('https://cresta-3240.twil.io/mediaStartSecWrap', options)
            .then(resp => resp.json())
            .then(data => console.log(data));
        })

        // ** On Action of worker wrapping up a Flex Task end the media stream **
        reservation.on("wrapup", (reservation) => {
          console.log('**** CALLING FETCH TO END MEDIA ****')
          const body = {
            callId: reservation.task.attributes.call_sid,
            Token: manager.store.getState().flex.session.ssoTokenPayload.token
          };
      
          const options = {
            method: 'POST',
            body: new URLSearchParams(body),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
          }
          fetch('https://cresta-3240.twil.io/mediaStopByNameSecWrap', options)
            .then(resp => resp.json())
            .then(data => console.log(data));
        });
      }
    }) 

    // Below two lines can be removed but useful to see if Plugin Loaded when testing

    const layoutOptions = { sortOrder: -1 };
    flex.AgentDesktopView.Panel1.Content.add(<CustomTaskList key="SamplePlugin-component" />, layoutOptions);
      
  }
}


