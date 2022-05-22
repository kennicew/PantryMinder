import React, { useEffect, useState } from "react";

import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";


import * as Clarifai from "clarifai";
// @ts-ignore
// import { CLARIFAI_API_KEY } from "@env";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

// import { Text, View } from "../components/Themed";
import { Text, View } from "react-native";

export default function DetectFoodsScreen() {
  const [predictions, setPredictions] = useState(null);
  const [imageToAnalyze, setImageToAnalyze] = useState(null);

  const clarifaiApp = new Clarifai.App({
    apiKey: '59559f3c8ad94047a3b72d1398f4fffa',
  });
  process.nextTick = setImmediate;

  let freshness = { 
    apple: '21-28', 
    apricots: '4-5', 
    avocado: '3-5', 
    blueberries: '7-14', 
    banana: '3-5',
    cherries: '4-7',
    cranberries: '21-28', 
    gooseberries: '2-3', 
    grapefruit: '21-28', 
    grapes: '5-7', 
    guava: '3-4', 
    kiwi: '5-7', 
    mango: '5-7', 
    melons: '7-10', 
    nectarine: '3-5', 
    oranges: '21-28',
    peaches: '3-5', 
    pear: '5-7', 
    pineapple: '3-5', 
    plums: '3-5', 
    pomegranate: '30-60', 
    pricklypear: '1-3',
    raspberries: '2-3', 
    rhubarb: '5-7', 
    strawberries: '3-5',
    watermelon: '14',
    asparagus: '3-4',
    beans: '3-5',
    beets: '14', 
    broccoli: '3-5',
    brusselssprouts: '3-5',
    cabbage: '7', 
    carrots: '21-28',
    cauliflower: '7', 
    celery: '7-14', 
    corn: '1-2',
    cucumbers: '7', 
    greenonions: '7-10',
    lettuce: '7', 
    mushrooms: '4-7',
    onions: '30-60',
    parsnips: '21-28',
    peas: '3-5',
    peppers: '7-14', 
    potatoes: '7-14',
    rutabaga: '14-21', 
    spinach: '3-5',
    sprouts: '3-5',
    squash: '4-5', 
    tomatoes: '1-5',
  }; 

  const loadFonts = async () => {
    await Font.loadAsync({
      // Load a font `Montserrat` from a static resource
      ReggaeOne: require('./assets/fonts/ReggaeOne-Regular.ttf'),

      // Any string can be used as the fontFamily name. Here we use an object to provide more control
      'ReggaeOne-Regular': {
        uri: require('./assets/fonts/ReggaeOne-Regular.ttf'),
        display: Font.FontDisplay.FALLBACK,
      },
    });
    this.setState({ fontsLoaded: true });
  };

  loadFonts();

  useEffect(() => {
    const getPermissionAsync = async () => {
      if (Platform.OS !== "web") {
        const {
          status,
        } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    };
    getPermissionAsync();
  }, []);

  const clarifaiDetectObjectsAsync = async (source: string | undefined) => {
    try {
      const newPredictions = await clarifaiApp.models.predict(
        { id: Clarifai.FOOD_MODEL },
        { base64: source },
        { maxConcepts: 10, minValue: 0.4 }
      );
      // console.log(newPredictions.outputs[0].data.concepts);
      setPredictions(newPredictions.outputs[0].data.concepts);
    } catch (error) {
      console.log("Exception Error: ", error);
    }
  };

  const selectImageAsync = async () => {
    try {
      let response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!response.cancelled) {
        // resize image to avoid out of memory crashes
        const manipResponse = await ImageManipulator.manipulateAsync(
          response.uri,
          [{ resize: { width: 900 } }],
          {
            compress: 1,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        const source = { uri: manipResponse.uri };
        setImageToAnalyze(source);
        setPredictions(null);
        // send base64 version to clarifai
        await clarifaiDetectObjectsAsync(manipResponse.base64);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>PANTRYMINDER</Text>
          <Text style={styles.headerText}>Choose an Image</Text>

          <TouchableOpacity
            style={styles.imageWrapper}
            onPress={selectImageAsync}
          >
            {imageToAnalyze && (
              <View style={{ position: "relative" }}>
                <View
                  style={{
                    zIndex: 0,
                    elevation: 0,
                  }}
                >
                  <Image
                    source={imageToAnalyze}
                    style={styles.imageContainer}
                  />
                </View>
              </View>
            )}

            {!imageToAnalyze && (
              <Text style={styles.transparentText} >Tap to choose image</Text>
            )}
          </TouchableOpacity>
          <View style={styles.predictionWrapper}>
            {imageToAnalyze && (
              <Text style={styles.predictionHeaderText}>
                Predictions {predictions ? "" : "Predicting..."}
              </Text>
            )}
            {predictions &&
              predictions?.length &&
              console.log("=== Detect foods predictions: ===")}

            {predictions &&
              predictions.map(
                (
                  p: { name: React.ReactNode; value: React.ReactNode },
                  index: string | number | null | undefined
                ) => {
                  let foodname: string = p.name
                  let days = freshness[foodname]
                  console.log(`${index} ${p.name}: ${p.value}`);
                  if (parseFloat(p.value).toFixed(3) > 0.82 && freshness[foodname]) return (
                    <View style={styles.predictionContainer}>
                      <Text key={index} style={styles.text}>
                        {days} days 
                      </Text>
                      <Text key={index} style={styles.text}>
                      {p.name} {parseFloat(p.value).toFixed(3)}
                      </Text>
                    </View>
                  );
                }
              )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    flex: 1,
    backgroundColor: "#eef7f6"
  },
  welcomeContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  contentContainer: {
    padding: 30,
  },
  predictionContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    backgroundColor: '#ffdc5e',
    borderRadius: 5,
    margin: 3,
  },
  title: {
    marginTop: 1,
    fontSize: 30,
    fontWeight: "bold",
    color: "#ff69eb",
    // fontFamily: "ReggaeOne-Regular"
  },
  headerText: {
    marginTop: 15,
    fontSize: 22,
    // fontWeight: "bold",
    color: "black",
  },
  predictionHeaderText: {
    margin: 15,
    fontSize: 27,
    fontWeight: "bold",
    color: "#ffbf81",

  },
  text: {
    fontSize: 20,
    padding: 4,
    color: 'black'
  },
  imageWrapper: {
    width: 300,
    height: 300,
    borderColor: "#ffa3a5",
    borderWidth: 3,
    borderStyle: "dashed",
    marginTop: 40,
    marginBottom: 10,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: 280,
    height: 280,
  },
  predictionWrapper: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  transparentText: {
    opacity: 0.8,
  },
});
