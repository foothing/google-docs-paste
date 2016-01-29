$(document).ready(function(){
	$("#google-docs-container").on('paste', function(e){
		var content = e.originalEvent.clipboardData.getData('text/html');
		console.log(content);
		var parser = new DriveParser();
		var content = parser.setContent(content).parse();
		$("#result").html(content);
	});
})