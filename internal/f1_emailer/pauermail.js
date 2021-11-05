$(function() {
	var nav = Navigation();

	var header = Doom.create({
		className: "header",
		innerText: "PauerMail",
		child: nav
	});

	var background = Doom.create({
		className: "background"
	});

	Doom.create({
		parentNode: document.body,
		children: [
			background,
			header,
		]
	});

	$(document).ajaxStart(function () {
		$('#ajaxBusy').show();
	}).ajaxStop(function() {
		$('#ajaxBusy').hide();
	});
	
	fillSelectMailingList();

	$("body").on("click", "#dropdownList li", function() {
		$("#listAlert").collapse("hide")
		var list = {
			name: $(this).text(),
			id: $(this).data("id"),
		}
		dropdownChange(list, "listButton")
		getMailingList(list.id)
		displayEmailList()
	});

	$("#createList").click(function() {
		clearList()
		if ($("#mailingListDiv").is(":hidden")) {
				$("#mailingListDiv").collapse("show")
		} else {
			if ($("#editList").is(":disabled")) {
				$("#mailingListDiv").collapse("hide")
			}
		}
	})

	$("#editList").click(function() {
		if ($("#mailingListDiv").is(":hidden")) {
			$("#mailingListDiv").collapse("show")
		} else {
			$("#mailingListDiv").collapse("hide")
		}
	})

	$("#deleteList").click(function () {
		if (confirm("Are you sure you wish to delete the mailing list '"+$("#name").val()+"'")){
      $.ajax({
        method: "POST",
        url: "../../phpfiles/pauermail/deletefromdb.php",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ 
          list: $("#listButton").val(),
					name: $("#name").val(),
        }),
      })
      .done(function(data) {
        if (data.errorCode && data.errorCode != 0) {
					changeAlert("listAlert", "danger", data.msg)
        } else {
					changeAlert("listAlert", "warning", data)
					$("#mailingListDiv").collapse("hide")
					clearList()
          fillSelectMailingList()
        }
      })
    }
	})

	$("#submitList").click(function() {
		$.ajax({
			method: "POST",
			url: "../../phpfiles/pauermail/savemailinglist.php",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify({
				name: $("#name").val(),
				fromName: $("#fromName").val(),
				fromAddress: $("#fromAddress").val(), 
				template: $("#template").val(), 
				description: $("#description").val(), 
			})
		})
		.done(function(data) {
      console.log(data)
      if (data.errorCode && data.errorCode != 0) {
				let alertText = data.msg + ", error code: " + data.errorCode
				changeAlert("listAlert", "danger", alertText)
			} else {	
				changeAlert("listAlert", "success", data.msg)
				$("#mailingListDiv").collapse("hide")
				fillSelectMailingList($("#name").val())
			}
    })
	})

	// enable upload button when a file is selected
	$("#fileToUpload").change(function() {
		var text = $(this).val();
		text = text.substring(text.lastIndexOf("\\") + 1, text.length);
		$("#fileLabel").text(text)
		$("#fileUploadBtn").prop("disabled", false)
	})

	// file uploading
	$("#fileUploadBtn").click(function (event) {
		event.preventDefault()
		var fileData = $("#fileToUpload").prop('files')[0]
		var formData = new FormData()
		formData.append('file', fileData)
		$.ajax({
			method: "POST",
			url: "../../phpfiles/pauermail/uploadcsv.php",
			enctype: "multipart/form-data",
			data: formData,
			processData: false,
			contentType: false,
			cache: false,
		})
		.done(function(json) {
			var data = JSON.parse(json)
			console.log(data)
      if (data.errorCode && data.errorCode != 0) {
				changeAlert("fileAlert", "danger", data.msg + " /// Error code: " + data.errorCode)
      } else {
				$("#fileUploadBtn").prop("disabled", true)
				$("#fileAlert").collapse("hide")
				$.ajax({
					method: "POST",
					url: "../../phpfiles/pauermail/addtomailinglist.php",
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					data: JSON.stringify({ 
						filename: data.filename, 
						listID: $("#listButton").val(),
						listName: $("#name").val(),
						refreshList: $("#refreshList").is(":checked")
					})
				})
				.done(function(response) {
					console.log(response)
					if (response.statusCode == 200) {
						// alert(response.msg)
						displayEmailList()
						$("#fileToUpload").val("")
					} else if (response.errorCode && response.errorCode != 0) {
						alert(response.msg + "\nError code: " + response.errorCode)
					} else {
						alert("Unknown error with adding to mailing list")
					}
				})
			}
		})
	})

	$("#manualSubmit").click(function () {
		$.ajax({
			method: "POST",
			url: "../../phpfiles/pauermail/addtomailinglist.php",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify({ 
				email: $("#manualEmail").val(), 
				listID: $("#listButton").val(),
				listName: $("#name").val(),
			})
		})
		.done(function(response) {
			console.log(response)
			if (response.statusCode == 200) {
				// alert(response.msg)
				displayEmailList()
				$("#manualEmail").val("")
			} else if (response.errorCode && response.errorCode != 0) {
				alert(response.msg + "\nError code: " + response.errorCode)
			} else {
				alert("Unknown error with adding to mailing list")
			}
		})
	})

	// send blast button
	$("#blastButton").click(function() {
		var email = {
			subject: $("#subjectText").val(),
			fromAddress: $("#fromAddress").val(),
			fromName: $("#fromName").val(),
			listName: $("#name").val(),
			listID: $("#listButton").val(),
			template: $("#template").val(),
			etid: $("#etid").val(),
		}
		var confirmText = ("Are you sure you want to send this email blast with the current settings:\n\n")
		confirmText += ("Subject: " + email.subject + "\nFrom: " + email.fromAddress + "\nMailing list: " + email.listName + "\nTemplate: " + email.template)
		if (confirm(confirmText)) {
			if (confirm("Are you really sure you want to send the email blast?")) {
				$.ajax({
					method: "POST",
					url: "../../phpfiles/pauermail/sendemailblast.php",
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					data: JSON.stringify({
						listName: email.listName,
						listID: email.listID,
						templateID: email.etid, 
						fromAddress: email.fromAddress,
						fromName: email.fromName,
					})
				})
				.done(function(data) {
					$("#viewLog").collapse("show")
					var log = ""
					for (i in data) {
						log += data[i] + "\n"
					}
					$("#logText").text(log)
				})
				.fail(function(xhr) {
					var log = "Sending email blast returned error..."
					log += "\nxhr response:" + xhr.responseText
					$("#viewLog").collapse("show")
					$("#logText").text(log)
				})
			}
		}
	})

	//clear log button
	$("#clearLog").click(function () {
		$("#viewLog").collapse("hide")
		$("#logText").text("")
	})

	$("#previewTemplate").click(function() {
		$("#preview").collapse("show")
		$("#closePreview").prop("disabled", false)
		$("#previewTemplate").prop("disabled", true)
  })

  $("#closePreview").click(function () {
		$("#preview").collapse("hide")
		$("#closePreview").prop("disabled", true)
		$("#previewTemplate").prop("disabled", false)
	})
	
	$("#editTemplate").click(function () {
		location.href = "./emailtemplates.html?etid=" + $("#etid").val() + "&list_id=" + $("#listButton").val()
	})

	// check mailing list fields and enable submit button when all filled
	$(".mailingList").keyup(function() {
		var empty = false
		$(".mailingList").each(function() {
			if ($(this).val() == '') {
				empty = true
			}
		})
		if (empty) {
			$("#submitList").prop("disabled", true)
		} else {
			$("#submitList").prop("disabled", false)
		}
	})

	// manual email submit
	$("#manualEmail").keyup(function() {
		if ($.trim($(this).val())) {
			$("#manualSubmit").prop("disabled", false)
		} else {
			$("#manualSubmit").prop("disabled", true)
		}
	})

});	// End of ready

function fillSelectMailingList(current) {
	$.ajax({
		method: "POST",
		url: "../../phpfiles/pauermail/getselectdata.php",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({ 
      table: "mailing_lists",
			field: "name",
			uid: "list_id",
    }),
	})
	.done(function(data) {
		console.log(data)
		var s = ""
		if (data.length > 0) {
			for (i in data) {	
				s += '<li class="dropdown-item" data-id="'+data[i].list_id+'">'+data[i].name+'</li>'
			}
			$("#dropdownList").html(s)
			$("#listButton").val("")
		}
		else {
			console.log("No mailing lists")
			$("#createMailingList").collapse("show")
		}
		var urlParams = new URLSearchParams(window.location.search)
		var list = {
			id: "",
			name: "",
		}
		if (urlParams && urlParams.has("list_id")) {
			list.id = urlParams.get("list_id")
			list.name = $("ul li[data-id='" + list.id + "']").text()
			console.log(list)
			if (list.name != "") {
				dropdownChange(list, "listButton")
				getMailingList(list.id)
				displayEmailList()
			}
			else {
				changeAlert("listAlert", "warning", "No mailing list exists with the ID '" + list.id + "'")
			}
		}
		else if (current) {
			list.name = current
			list.id = $("ul li:contains(" + list.name + ")").data("id")
			dropdownChange(list, "listButton")
			getMailingList(list.id)
			displayEmailList()
		}
	})
}

function displayEmailList() {
	$.ajax({
		method: "POST",
		url: "../../phpfiles/pauermail/getemails.php",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({ 
			list: $("#listButton").val(),
			name: $("#name").val(),
		})
	})
	.done(function(data) {
		if (data && data.length > 0) {
			$("#showEmails").collapse("show")
			let alert = "Mailing list '"+$("#name").val()+"' contains "+data.length+" valid email addresses"
			changeAlert("emailAlert", "info", alert)
			let str = ""
			for (i in data) {
				str += data[i].email + "\n"
			}
			$("#emailText").text(str)
			if ($("#preparedEmail").is(":visible")) {
				$("#sendBlast").collapse("show")
			}
		}
		else {
			changeAlert("emailAlert", "warning", "Warning: the selected mailing list contains no valid email addresses")
			$("#sendBlast").collapse("hide")
			$("#showEmails").collapse("hide")
		}
	})
}

function getMailingList(listID) {
	$.ajax({
		method: "POST",
		url: "../../phpfiles/pauermail/getfromdb.php",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({
			table: "mailing_lists",
			field: "list_id",
			find: listID,
		})
	})
	.done(function(data) {
		console.log(data)
		if (data.errorCode && data.errorCode != 0) {
			let alertText = data.msg + ", error code: " + data.errorCode 
			changeAlert("listAlert", "danger", alertText)
		} else {
			$("#addEmails").collapse("show")
			$("#fileAlert").collapse("hide")
			$("#editList").prop("disabled", false)
			$("#deleteList").prop("disabled", false)
			$("#name").val(data.name) 
			$("#fromName").val(data.from_name)
			$("#fromAddress").val(data.from_address)
			$("#template").val(data.template)
			$("#description").val(data.description) 
			$("#fromText").val(data.from_address)
			loadTemplate(data.template)
		}
	})
}

function loadTemplate(template) {
	$.ajax({
		method: "POST",
		url: "../../phpfiles/pauermail/getfromdb.php",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({
			table: "emails_template",
			field: "type",
			find: template
		})
	})
	.done(function(response) {
		console.log(response)
		if (response.errorCode && response.errorCode != 0) {
			if (response.errorCode == -900) {		
				let alert = "The template for this mailing list, '" + $("#template").val() + "', does not exist, "
				alert += '<a class="alert-link" href="./emailtemplates.html?type=' + $("#template").val() + '&list_id=' + $("#listButton").val() + '">click here to create it.</a>'
				changeAlert("templateAlert", "danger", alert)
			}
			else {
				let templateAlert = response.msg + " /// Error code: " + response.errorCode
				changeAlert("templateAlert", "danger", templateAlert)
			}
			$("#preparedEmail").collapse("hide")
			$("#sendBlast").collapse("hide")
		} else {
			changeAlert("templateAlert", "info", "Loaded template: " + response.type)
			$("#preparedEmail").collapse("show")
			$("#etid").val(response.etid)
			$("#subjectText").val(response.subject)
			$("#htmlText").val(response.html)
			$("#preview").html(response.html)
			if ($("#emailText").is(":visible")) {
				$("#sendBlast").collapse("show")
			}
		}
	})
}

function clearList(){
	$("#listButton").html('Select Mailing List <span class="caret" style="padding-left: 5px;"></span>')
	$("#listButton").val("")
	$(".active").removeClass("active")
	$("#preview").html("")
	$("#logText").text("")
	$(".container .collapse").collapse("hide")
	$("#editList").prop("disabled", true)
	$("#deleteList").prop("disabled", true)
	$(".mailingList").each(function(i, o) {
		$(this).val("")
	})
}

function dropdownChange(item, buttonID) {
	var button = $("#" + buttonID)
	button.html(item.name + '<span class="caret" style="padding-left: 5px;"></span>')
	button.val(item.id)
	$("ul li.active").removeClass("active")
	$("ul li[data-id='" + item.id + "']").addClass("active")
	$("#preview").collapse("hide")
	$("#closePreview").prop("disabled", true)
}

function changeAlert(elemID, newAlert, alertText) {
	var elem = $("#" + elemID)
	elem.removeClass(function (index, className) {
		return (className.match (/(^|\s)alert-\S+/g) || []).join(' ');
	})
	elem.addClass("alert-"+newAlert)
	elem.html(alertText)
	elem.collapse("show")
}
