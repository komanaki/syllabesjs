/*
 * Syllabes.js - Demo
 * 
 * Notes :
 * - Yes, it uses jQuery.
 * - No, the code isn't really beautiful.
 * - But it's just a demo script, so it's not that important.
 */

// Init the library.
syllabes = new Syllabes();

// Keep references to HTML elements
var $files = $('#files');
var $inputNumber = $('input[type="number"]');
var $inputCheckbox = $('input[type="checkbox"]');
var $ul = $('ul');
var $pre = $('pre');

// Configuration for the library
var config = {
	syllable_precision: true
};

// File extension <> file format
var ext = {
	txt: 'ultrastar',
	srt: 'subrip',
	vtt: 'webvtt'
};

// Fetch the file, parse it, display it
var parse = function(filename, format) {
	$.get(filename, function(data) {
		var parsed = syllabes.parse(format, data, config);

		console.log('Parsed file :', filename, parsed);
		$pre.text(JSON.stringify(parsed, null, 4));

		$ul.empty();

		for (var i in parsed.track) {
			var s = parsed.track[i];

			if (s.syllables !== undefined) {
				var $li = $('<li></li>');
				$ul.append($li);

				for (var j in s.syllables) {
					$li.append('<span>' + s.syllables[j].text + '</span>');
				}

			} else {
				$ul.append('<li>' + s.text + '</li>');
			}
		}
	});
};

// Parse the currently selected file
var parseCurrentFile = function() {
	parse('files/' + $files[0].value, ext[$files[0].value.split('.')[1]]);
}

// When we change the selected file
$files.on('change', function() {
	parseCurrentFile();
});

// When we change a numeric option
$inputNumber.on('change, keyup', function() {
	config[$(this).attr('name')] = $(this).val();
	parseCurrentFile();
});

// When we change a boolean option
$inputCheckbox.on('change', function() {
	config[$(this).attr('name')] = $(this).is(':checked');
	parseCurrentFile();
});

// Parse on startup
parseCurrentFile();