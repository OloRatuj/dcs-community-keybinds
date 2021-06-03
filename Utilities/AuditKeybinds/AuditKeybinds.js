const DcsAircraftModulesFolderPath = 'F:\\DCS\\Mods\\aircraft\\';
const KeybindsRootPath = 'F:\\DCS Community Keybinds\\';
const KeybindsInputCommandsFolderPath = KeybindsRootPath + 'InputCommands\\';
const ReportFolderPath = KeybindsRootPath + 'CoverageReport\\';

const fs = require('fs');
const FileHelper = require('.\\Helpers\\FileHelper');
var ModuleParsers = {};

fs.readdirSync(DcsAircraftModulesFolderPath).forEach(aircraftModuleId => {
//	if (aircraftModuleId == 'AJS37') {
		var aircraftModule = gather(aircraftModuleId);
		process(aircraftModule);
		report(aircraftModule);
//	}
});

//--------------------------------

function gather(aircraftModuleId) {
	return {
		Id: aircraftModuleId,
		Files: {
			ClickableDataFiles: FileHelper.FindFiles(DcsAircraftModulesFolderPath + aircraftModuleId + '\\Cockpit\\', 'clickabledata.lua'),
			InputBaseFiles: {
				joystick: FileHelper.FindFiles(DcsAircraftModulesFolderPath + aircraftModuleId + '\\Input\\', 'joystick\\default.lua'),
				keyboard: FileHelper.FindFiles(DcsAircraftModulesFolderPath + aircraftModuleId + '\\Input\\', 'keyboard\\default.lua')
			},
			InputCommandFiles: {
				joystick: FileHelper.FindFiles(KeybindsInputCommandsFolderPath + aircraftModuleId + '\\Input\\', 'joystick\\default.lua'),
				keyboard: FileHelper.FindFiles(KeybindsInputCommandsFolderPath + aircraftModuleId + '\\Input\\', 'keyboard\\default.lua'),
			}
		}
	}
}

function process(aircraftModule) {
	aircraftModule.Data = {};
	aircraftModule.Log = [];

	for (var clickableDataFileKey in aircraftModule.Files.ClickableDataFiles) {
		var subModule;
		var clickableDataFilePath = aircraftModule.Files.ClickableDataFiles[clickableDataFileKey];
		if (aircraftModule.Files.ClickableDataFiles.length > 1) {
			var subModulePathSplit = clickableDataFilePath.split('\\');
			subModule = subModulePathSplit[subModulePathSplit.length - 2];
		} else {
			subModule = aircraftModule.Id;
		}

		console.log('generating report for ' + subModule);

		var moduleParser = FileHelper.GetModuleParser(subModule);

		try {
			aircraftModule.Data[subModule] = {
				ClickableData: FileHelper.ParseClickableDataFilewithModuleParser(clickableDataFilePath, moduleParser),
				InputBases: FileHelper.ParseInputBaseFileswithModuleParser(aircraftModule.Files.InputBaseFiles, moduleParser),
				InputCommands: FileHelper.ParseInputBaseFileswithModuleParser(aircraftModule.Files.InputCommandFiles, moduleParser)
			}
		} catch(exception) { }
	}
}

function report(aircraftModule) {
	var reportFolderStat;
	try {
		reportFolderStat = fs.statSync(ReportFolderPath);
	} catch(exception) {
		if (!reportFolderStat || !reportFolderStat.isDirectory()) {
			fs.mkdirSync(ReportFolderPath);
		}
	}

	for (var aircraftModuleDataKey in aircraftModule.Data) {
		var reportHtml = '';

		if (aircraftModule.Data[aircraftModuleDataKey].ClickableData && aircraftModule.Data[aircraftModuleDataKey].ClickableData.Devices) {
			for (var deviceKey in aircraftModule.Data[aircraftModuleDataKey].ClickableData.Devices) {
				reportHtml += '<h1>' + deviceKey + '</h1>';

				reportHtml += '<table>';
				reportHtml += '<thead><tr>';
				reportHtml += '<td>ID</td>';
				reportHtml += '<td>Group</td>';
				reportHtml += '<td>Command</td>';
				reportHtml += '<td>Label</td>';
				reportHtml += '<td>Handler</td>';
				reportHtml += '</tr></thead>';
				var deviceControls = aircraftModule.Data[aircraftModuleDataKey].ClickableData.Devices[deviceKey];
				for (var controlKey in deviceControls) {
					var control = deviceControls[controlKey];

					reportHtml += '<tr>';
					reportHtml += '<td>' + control.Id + '</td>';
					reportHtml += '<td>' + control.Group + '</td>';
					reportHtml += '<td>' + control.Control + '</td>';
					reportHtml += '<td>' + control.Label + '</td>';
					reportHtml += '<td>' + control.Handler + '</td>';
					reportHtml += '</tr>';
				}
				reportHtml += '</table>';
			}

			fs.writeFileSync(ReportFolderPath + aircraftModuleDataKey + '.html', reportHtml);
		}
	}
}