import React, { Component } from 'react';
import { View, StyleSheet, Text, Button, PermissionsAndroid, AppState, Platform } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import RNSoundLevel from 'react-native-sound-level'
import Animated from 'react-native-reanimated';
import { Buffer } from 'buffer'
import base64 from 'react-native-base64'
import { PI, cos, sin } from 'react-native-redash';
import VIForegroundService from '@voximplant/react-native-foreground-service';





const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  visualizer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
});


const { Value, multiply, add } = Animated;

console.log(Value)
console.log(multiply)
console.log(add)

const options = {
  sampleRate: 16000,  // default 44100
  channels: 1,        // 1 or 2, default 1
  bitsPerSample: 16,  // 8 or 16, default 16
  audioSource: 6,     // android only (see below)
  wavFile: 'test.wav' // default 'audio.wav'
}

export default class AudioVisualizer extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      volume: 0,
      theta: new Value(0),
      isRunningService: false,
    };
    this.counter = 0
    //AudioRecord.init(options);
    //console.log(AudioRecord.toString())
    /*
    this.recording = AudioRecord.on('data', data => {
      if(this.counter > 50){
       // console.log(data)
        let chunk = Buffer.from(data, 'base64')
        console.log(chunk)
        //this.setState({volume: data})
        this.counter = 0
      }
      this.counter = this.counter + 1
      console.log(this.counter)

    });
    */
    console.log('constructed')
    this.date = new Date()
    this.color = 'black'
    this.foregroundService = VIForegroundService.getInstance();
  }

  async componentDidMount() {
    console.log('mounting')
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ])
    
    console.log('mounted')
  }

  async componentWillUnmount() {
    console.log('unmounting')
    await this.stopService()
    //AudioRecord.stop();
    RNSoundLevel.stop()
  }

  async startService() {
    if (Platform.OS !== 'android') {
        console.log('Only Android platform is supported');
        return;
    }
    if (this.state.isRunningService) return;
    if (Platform.Version >= 26) {
        const channelConfig = {
            id: 'ForegroundServiceChannel',
            name: 'Notification Channel',
            description: 'Notification Channel for Foreground Service',
            enableVibration: false,
        };
        await this.foregroundService.createNotificationChannel(channelConfig);
    }
    const notificationConfig = {
        channelId: 'ForegroundServiceChannel',
        id: 3456,
        title: 'Foreground Service',
        text: 'Foreground service is running',
        icon: 'ic_launcher',
        button: 'Stop service'
    };
    try {
        this.subscribeForegroundButtonPressedEvent();
        await this.foregroundService.startService(notificationConfig);
        this.setState({isRunningService: true});
    } catch (_) {
        console.log('caught')
        this.foregroundService.off();
    }
}

async stopService() {
  if (!this.state.isRunningService) return;
  this.setState({isRunningService: false});
  await this.foregroundService.stopService();
  this.foregroundService.off();
}

subscribeForegroundButtonPressedEvent() {
  console.log('subscribed')
  this.foregroundService.on('VIForegroundServiceButtonPressed', async () => {
      await this.stopService();
  });
}

  handlePress = async () => {
    console.log('pressed')
    //AudioRecord.start()
      RNSoundLevel.start()
      RNSoundLevel.onNewFrame = (data) => {
      // see "Returned data" section below
      let newTime = new Date()
      console.log(newTime-this.date)
      this.date = newTime
      console.log('Sound level info', data.value)
      if(data.value>-50){
        this.color = 'red'
      }
      else{
        this.color = 'black'
      }
      if(AppState.currentState == 'active'){
        this.setState({volume: data.value})
      }
      
  
      }
      await this.startService()
      
   
    
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={{color: this.color}}>
          {this.state.volume}
        </Text>
        <Button onPress={this.handlePress} title = {"Start Recording"}>
        </Button>
      </View>
    );
  
  }
}