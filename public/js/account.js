$(function() {
	var aBtn = $('#account_ul'),
		aDiv = $('#account_cont'),
		oModify = $('#basicInfo_update'),
		oSub = $('#basicInfo_submit'),
		oCancel = $('#basicInfo_cancel'),
		oSubPic = $('#pic_submit');

	var target = null;
	var index = 0;

	$.ms_DatePicker({
		YearSelector: "#selBirthdayYear",
		MonthSelector: "#selBirthdayMonth",
		DaySelector: "#selBirthdayDay"
	});

	oModify.on('click', function() {
		$('#showBasicInfo').addClass('none');
		$('#hideBasicInfo').removeClass('none');
		oSub.removeClass('none');
		$(this).addClass('none');
	});
	oCancel.on('click', function() {
		$('#hideBasicInfo').addClass('none');
		$('#showBasicInfo').removeClass('none');
		oModify.removeClass('none');
		oSub.addClass('none');
	});
	aBtn.on('click', function(ev) {
		if (ev.target.tagName === 'A') {
			target = ev.target;
			index = $(target).parent().index();
			$(target).parent().addClass('active').siblings().removeClass('active');
			aDiv.children().eq(index).removeClass('none').siblings().addClass('none');
		}
	});
	oSub.on('click', function() {
		var sex = $('[name=basicInfoSex]').val(),
			birthday = $('[name=basicInfoYear]').val() + '-' + $('[name=basicInfoMonth]').val() + '-' + $('[name=basicInfoDay]').val(),
			maritalstatus = $('[name=basicInfoMerried]').val(),
			address = $('[name=basicInfoProvince]').val() + '-' + $('[name=basicInfoCity]').val() + '-' + $('[name=basicInfoArea]').val(),
			profession = $('[name=basicInfoPro]').val(),
			nativeplace = $('[name=basicInfoHometownProvince]').val() + '-' + $('[name=basicInfoHometownCity]').val() + '-' + $('[name=basicInfoHometownArea]').val(),
			sign = $('[name=basicInfoSign]').val(),
			edulevel = $('[name=basicInfoEduLevel]').val(),
			eduschool = $('[name=basicInfoEduSchool]').val(),
			edutime = $('[name=basicInfoEduTime]').val(),
			edulevel1 = $('[name=basicInfoEduLevel1 ]').val(),
			eduschool1 = $('[name=basicInfoEduSchool1 ]').val(),
			edutime1 = $('[name=basicInfoEduTime1]').val(),
			edulevel2 = $('[name=basicInfoEduLevel2]').val(),
			eduschool2 = $('[name=basicInfoEduSchool2]').val(),
			edutime2 = $('[name=basicInfoEduTime2]').val(),
			educationexperience = [{
				level: edulevel,
				school: eduschool,
				time: edutime
			}, {
				level: edulevel1,
				school: eduschool1,
				time: edutime1
			}, {
				level: edulevel2,
				school: eduschool2,
				time: edutime2
			}];
		
		$.ajax({
			url: 'api/update/account',
			data: {
				basicInfoSex: sex,
				birthday: birthday,
				maritalstatus: maritalstatus,
				profession: profession,
				address: address,
				nativeplace: nativeplace,
				sign: sign,
				educationexperience: educationexperience
			},
			type: 'GET',
			dataType: 'json',
			success: function(json) {
				// console.log(json);
				var data = json.data,
					sex = data.sex,
					bir = data.birthday.split('-'),
					mar = data.maritalstatus,
					nat = data.nativeplace.split('-'),
					add = data.address.split('-'),
					sign = data.sign,
					pro = data.profession,
					edu = data.educationexperience;
				if (json.status) {
					alert('更新成功');
					window.location.reload();
				}
			}
		});
	});

	oSubPic.on('click', function() {
		$.ajax({
			url: 'api/update/userPic',
			data: {
				nick: $('#nick').val(),
				head: $('#fileurl').val()
			},
			dataType: 'json',
			type: 'GET',
			success: function(json) {
				// console.log(json);
				if (json.status) {
					alert('修改成功');
					window.location.reload();
				}
			}
		});
	});
});
$(function() {
	var $imgform = $("#image_form");
	var $choosebox = $('#choosebox');
	var $file = $('#file');
	var $fileurl = $('#fileurl');
	var tp;
	$choosebox.click(function() {
		$file.click();
	});
	$file.change(function() {
		$choosebox.text($file.val());
	});

	$('#upload').click(function() {
		if (!$file.val()) {
			alert('请选择上传的图片');
			return false;
		}
		$imgform.ajaxForm({
			url: $imgform.attr('action'),
			type: 'POST',
			success: function(res) {
				// console.log(res);
				if (!res.status) {
					alert(res.msg);
					return false;
				} else {
					alert(res.msg);
					if (res.status == 3) {
						$('.avatar-account').find('img').attr('src', res.data.imgurl);
						$fileurl.val(res.data.imgurl);
					}
				}
				$choosebox.text('点击选择图片');
				$imgform.clearForm();
			},
			error: function(res, status, e) {
				alert(e);
				$imgform.clearForm();
			}
		});
	});
});

$(function() {
	var oldP = $('#old_password'),
		newP = $('#new_password'),
		newPR = $('#new_password_repeat'),
		updateP = $('#update_password');
	updateP.on('click', function() {
		if (newP.val() !== newPR.val()) {
			alert('两次输入的密码不一致');
			return false;
		}
		$.ajax({
			url: 'api/update/password',
			data: {
				password: oldP.val(),
				newPassword: newP.val()
			},
			dataType: 'json',
			type: 'GET',
			success: function(json) {
				console.log(json);
				if (json.status) {
					// alert('修改成功');
					// window.location.reload();
				}
			}
		});
	});
});