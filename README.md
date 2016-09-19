![syllabes.js](logo.png)
========================

syllabes.js is a JavaScript library that can parse multiple types of subtitles or lyrics, so you can use them in your application the same way no matter their file format.

**Here's how you could use it :**

- Display subtitles on a video with a custom style
- Act as a polyfill for browser that doesn't understand WebVTT
- Scroll the lyrics of a song like a karaoke

**Useful links :**

- [How to contribute](https://github.com/Komanaki/syllabesjs/CONTRIBUTE.md)

syllabes.js is proudly written in [TypeScript](http://www.typescriptlang.org/), and is available under the [MIT license](https://www.tldrlegal.com/l/mit).

Installation
------------

Download the library using one of these ways :

- Clone this git repository
- Download the [development version](https://raw.githubusercontent.com/Komanaki/syllabesjs/master/dist/syllabes.js) or the production-ready [minifed file](https://raw.githubusercontent.com/Komanaki/syllabesjs/master/dist/syllabes.min.js).

Supported file formats
----------------------

- **Ultrastar** (.txt) : Used by a PC karaoke game. Contains song metadata and lyrics for one or two people, with syllable precision.
- **SubRip** (.srt) : Simple subtitles format for videos. Contains sentences with optional formatting and on-screen positioning.
- **Sub Station Alpha, Advanced SSA** (.ssa, .ass) : Powerful subtitles format for videos. Contains sentences with optional metadata, formatting, styling and on-screen positioning.
- **WebVTT** (.vtt) : W3C standard to display subtitles on HTML5 videos. Contains sentences with optional formating, on-screen positioning, multiple voices and syllable precision.

Feature               | Ultrastar | SubRip | SSA / ASS | WebVTT
--------------------- | :-------: | :----: | :-------: | :----:
Sentences             | ✔ | ✔ | ✘ | ✔
Syllables             | ✔ | - | - | ✘
Metadata              | ✔ | - | ✘ | ✘
Multiple tracks       | ✔ | - | - | -
On-screen positioning | - | ✔ | ✘ | ✘
Voice indicators      | - | - | - | ✘
Text formating        | - | ✔ | ✘ | ✘
Text styling          | - | - | ✘ | ✘

**Legend :**

- ✔ : Supported by the format
- ✘ : Supported by the format but not implemented yet in syllabes.js
- \- : Not supported by the format

Usage
-----

Start by instanciating the library.

```js
var sy = new Syllabes();
```

Then, call the `parse` method of the library with the file format and its content.

```js
var parsed = sy.parse('webvtt', '[... file content here ...]');
```

It also accepts an optional options object to influence the parsing.

```js
var config = {
    syllable_precision: false  
};
var parsed = sy.parse('ultrastar', '[... file content here ...]', config);
```

Don't forget to check the demonstration page in the `demo/` folder.

Output examples
---------------

Sentence object taken from the output of a parsed Ultrastar file :

```javascript
{
    id: 1,
    syllables: [
        {
            start: 15650,
            end: 15950,
            duration: 300,
            pitch: 11,
            text: "Rah!",
            type: "freestyle"
        },
        {
            start: 17350,
            end: 17750,
            duration: 400,
            pitch: 11,
            text: " Ah...",
            type: "freestyle"
        }
    ]
}
```

Sentence object taken from the output of a parsed SubRip file :

```javascript
{
    id: 1,
    start: 15650,
    end: 17750,
    duration: 2100,
    text: "Rah! Ah..."
}
```

The output can also include various metadata if the file format permits it.

Building
--------

1. Clone the git repository
2. While in the project repository, execute `npm install`
3. Execute `gulp watch` so it compiles the source code as you edit it
4. Execute `gulp build` to build all the source code
5. Execute `gulp minify` to make a minifed version of the library

Background
----------

At first, syllabes.js was just a bunch of code written for a school project, where we needed to display a song's lyrics in a karaoke-style (so syllable per syllable).

Seeing that there wasn't viable solutions to parse Ultrastar (an open-source Singstar clone) lyrics files in JavaScript, we decided to make our own parser using the few existing specifications of the format.

Seeing that the code worked quite well, I decided to release it in the wild while making enhancements and other files support easy.