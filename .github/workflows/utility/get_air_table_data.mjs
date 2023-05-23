// Purpose:
//   to get the App Store Project data from AirTable


import fetch from 'node-fetch';
import * as fs from 'fs';

const outputDirectory = ".";
const outputFileName = "applications.json";
const outputFilePath = `${outputDirectory}/${outputFileName}`;
const imagesDirectory = './images';

const air_table_url = 'https://api.airtable.com/v0/appWoI7NdLmgK8Vyx/App%20Store?view=Grid%20view';
const air_table_token = process.env.AIRTABLE_TOKEN;
const air_table_header = {
    headers: {
    'Authorization': `Bearer ${air_table_token}`
    }
}

let air_table_data;
let git_hub_data = [];
let applications;
let project_template = {
    title: "",
    subtitle: "",
    external_URL: "",
    thumbnail_image_URL: "",
    hero_image_URL: "",
    twitter_URL: "",
    medium_URL: "",
    github_URL: "",
    featured: false
};

async function get_air_table_data() {

    try {
        const response = await fetch(air_table_url, air_table_header);
        const data = await response.json();
        air_table_data = data;
    } catch (error) {
        console.error(error);
    }
}

async function fetch_data(url, header) {

    try {
        const response = await fetch(url, header);
        const data = await response.json();
        //console.log(data);
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function get_image(url, name) {
    
    const filePath = `${imagesDirectory}/${name}`;

    try {
        const response = await fetch(url);
        const dest = fs.createWriteStream(filePath);
        response.body.pipe(dest);
    } catch (error) {
        console.error(error);
    }

}

function writeArrayToJsonFile(array, filePath) {
  const jsonData = JSON.stringify(array, null, 2);

  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
      return;
    }
    console.log('Array successfully written to JSON file:', filePath);
  });
}

function process_air_table_data() {

    console.log("Processing Data");

    if(!air_table_data) {console.log("No data");}
    air_table_data.records.forEach((record) => {
    
        if(!record.fields["Has requirements?"] || !record.fields.Publish) {return}


        // -- INITIALIZE PROJECT OBJECT --
        let project = {
            title: "",
            subtitle: "",
            external_URL: "",
            thumbnail_image_URL: "",
            hero_image_URL: "",
            twitter_URL: "",
            medium_URL: "",
            github_URL: "",
            featured: false,
            internal_data: {
                "thumbnail_size": 0,
                "hero_size": 0
            }
        };



        // -- COPY PROJECT PROPERTIES --
        Object.keys(project).forEach((property) => {
            if (!record.fields[property]) {return}
            if (Array.isArray(record.fields[property])) {
                project[property] = record.fields[property][0];
            } else {
                project[property] = record.fields[property];
            }
        });



        // -- GET THUMBNAIL IMAGE --
        if (record.fields.Thumbnail[0].size != project.internal_data.thumbnail_size) {
            let image_name = project.title.toLowerCase().replace(/\s/g, '_') + "_thumbnail.webp";
            get_image(record.fields.Thumbnail[0].url,image_name);
            project.internal_data.thumbnail_size = record.fields.Thumbnail[0].size;
        }



        // -- GET HERO IMAGE --
        if (record.fields["Hero Image?"]) {
            let hero_image_column = record.fields["Hero Image Column"];
            if (record.fields[hero_image_column][0].size != project.internal_data.hero_size) {
                let image_name = project.title.toLowerCase().replace(/\s/g, '_') + "_hero.webp";
                get_image(record.fields[hero_image_column][0].url,image_name);
                project.internal_data.thumbnail_size = record.fields[hero_image_column][0].size;
            }
        }

        //console.log(project);

        git_hub_data.push(project);
        applications = {
            applications: git_hub_data
        }


    });

    writeArrayToJsonFile(applications, outputFilePath);

}

async function main() {
    
    air_table_data = await fetch_data(air_table_url, air_table_header);
    process_air_table_data();

}

main();
