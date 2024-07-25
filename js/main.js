document.addEventListener('DOMContentLoaded', async() => {
    console.log('DOMContentLoaded');

    const formatedFileTimestamp = ()=> {
      const d = new Date()
      const date = d.toISOString().split('T')[0].replaceAll('-','');
      const time = d.toTimeString().split(' ')[0].replaceAll(':','');
      return `${date}${time}`;
    };

    const scale = window.devicePixelRatio;
    const byteToKBScale = 0.0009765625;
    const displayedLengthVal=300
    
	const fps = 10;
	const defaultQuality = 10;

    var frameIndex=0;
	var staticFrames = [];
    var _canvas, _loadedMediaObj, _gif, _zoom_factor=1.0, vidH=0, vidW=0, displayedWidth, displayedHeight, mediaObjWidth, mediaObjHeight;

    const adjustQualityVal=document.querySelector('#adjustQualityVal');
    const adjustQualitySlider=document.querySelector('#adjustQualitySlider');
    adjustQualitySlider.addEventListener('input', (evt)=> {
      let tempSliderValue=evt.target.value;
      adjustQualityVal.value=tempSliderValue;
      let progress=((tempSliderValue / 30)*100*1.0);
      adjustQualitySlider['style']['background'] = `linear-gradient(to right, rgb(50, 125, 191) ${progress}%, #ccc ${progress}%)`;
    });
    adjustQualityVal.addEventListener('input', (evt)=> {
      let tempSliderValue=evt.target.value;
      adjustQualitySlider.value=tempSliderValue;
      let progress=((tempSliderValue / 30)*100*1.0);
      adjustQualitySlider['style']['background'] = `linear-gradient(to right, rgb(50, 125, 191) ${progress}%, #ccc ${progress}%)`;
    });
    
    adjustQualitySlider.value=defaultQuality;
    triggerEvent(adjustQualitySlider, 'input');

    // const isCrossOriginIsolated=document.getElementById('isCrossOriginIsolated');
    // if(crossOriginIsolated) {
    //   isCrossOriginIsolated.innerHTML='🟢'; // green
    // } else {
    //   isCrossOriginIsolated.innerHTML='🔴'; // red
    // }

    const gifWidth = document.querySelector('#gifWidth');
	const gifHeight = document.querySelector('#gifHeight');

    function scaleCanvas(_canvas, _loadedMediaObj, _zoom_factor, vidH, vidW, scale) {
        _canvas['style']['width'] = `${vidW}px`;
        _canvas['style']['height'] = `${vidH}px`;
        _canvas['style']['margin'] = '0 auto';
        _canvas['style']['display'] = 'flex';
        let cWidth=_zoom_factor*vidW*scale;
        let cHeight=_zoom_factor*vidH*scale;

        _canvas.width=cWidth;
        _canvas.height=cHeight;

        gifWidth.value=parseInt(cWidth);
        gifHeight.value=parseInt(cHeight);

        _canvas.getContext('2d', { alpha: false }).scale(scale, scale);
        if(_loadedMediaObj) {
            // _canvas.getContext('2d', { alpha: false }).globalCompositeOperation = 'copy'; 
            _canvas.getContext('2d', { alpha: false }).imageSmoothingEnabled = true;
            _canvas.getContext('2d', { alpha: false }).imageSmoothingQuality = 'high'; // low | medium| high
            _canvas.getContext('2d', { alpha: false }).drawImage(_loadedMediaObj, 0, 0, vidW*_zoom_factor, vidH*_zoom_factor);
        }
    }

    function reverseScaleCanvas(_canvas, _loadedMediaObj, _zoom_factor, cHeight, cWidth, scale) {
        _canvas.width=cWidth;
        _canvas.height=cHeight;

        let vidW=parseFloat(cWidth/_zoom_factor)/scale;
        let vidH=parseFloat(cHeight/_zoom_factor)/scale;

        _canvas['style']['width'] = `${vidW}px`;
        _canvas['style']['height'] = `${vidH}px`;
        _canvas['style']['margin'] = '0 auto';
        _canvas['style']['display'] = 'flex';

        _canvas.getContext('2d', { alpha: false }).scale(scale, scale);
        if(_loadedMediaObj) {
            // _canvas.getContext('2d', { alpha: false }).globalCompositeOperation = 'copy';
            _canvas.getContext('2d', { alpha: false }).imageSmoothingEnabled = true;
            _canvas.getContext('2d', { alpha: false }).imageSmoothingQuality = 'high'; // low | medium| high
        	_canvas.getContext('2d', { alpha: false }).drawImage(_loadedMediaObj, 0, 0, vidW*_zoom_factor, vidH*_zoom_factor);
        }
    }
    

    const mainWrapper = document.querySelector('#main-wrapper');
    const errorDisplay = document.querySelector('#errorDisplay');
    const mediaWrapper = document.getElementById('mediaWrapper');
    const renderGIFContainer = document.querySelector('#renderGIFContainer');

    const runBtn = document.querySelector('#runBtn');
    const saveOutputBtn = document.querySelector('#saveOutputBtn');

    const startVidPos = document.querySelector('#startVidPos');
	const endVidPos = document.querySelector('#endVidPos');
	
	const startUseCurrentTime = document.querySelector('.use-current-time[value="startVidPos"]');
	const endUseCurrentTime = document.querySelector('.use-current-time[value="endVidPos"]');

	gifWidth.disabled=true;
	gifHeight.disabled=true;

	function scaleGIFVals(evt) {
		let eleID = evt.target.id;
		// console.log(eleID);
		let maxSize = 600;
		let sizeBenchmark=mediaObjHeight;
	    if(mediaObjWidth<mediaObjHeight) {
	    	sizeBenchmark=mediaObjWidth;
	    }
		let scaleRatio=parseFloat(maxSize/sizeBenchmark);
		let maxHeight=parseInt(scaleRatio*mediaObjHeight);
		let maxWidth=parseInt(scaleRatio*mediaObjWidth);

		let currentGIFWidth=gifWidth.valueAsNumber;
		let currentGIFHeight=gifHeight.valueAsNumber;
		if( (currentGIFHeight>maxHeight) || (currentGIFWidth>maxWidth) ) {
			gifWidth.value=maxWidth;
			gifHeight.value=maxHeight;
		} 

		if(eleID=='gifWidth') {
			if(currentGIFWidth>maxWidth) {
				gifWidth.value=maxWidth;
				gifHeight.value=maxHeight;
			} else {
				scaleRatio=mediaObjHeight/mediaObjWidth;
				currentGIFHeight = scaleRatio*currentGIFWidth;
				gifHeight.value=parseInt(currentGIFHeight);
			}
		} else if(eleID=='gifHeight') {
			if(currentGIFHeight>maxHeight) {
				gifWidth.value=maxWidth;
				gifHeight.value=maxHeight;
			} else {
				scaleRatio=mediaObjWidth/mediaObjHeight;
				currentGIFWidth = scaleRatio*currentGIFHeight;
				gifWidth.value=parseInt(currentGIFWidth);
			}
		}
	}
	gifWidth.addEventListener('change', (evt)=> {
		scaleGIFVals(evt);
	});
	gifHeight.addEventListener('change', (evt)=> {
		scaleGIFVals(evt);
	});

	startUseCurrentTime.addEventListener('click', (evt)=> {
		let _loadedMediaObj = document.querySelector('#loadedMediaObj');
		if(_loadedMediaObj) {
			startVidPos.value=_loadedMediaObj.currentTime;
		}
	});
	endUseCurrentTime.addEventListener('click', (evt)=> {
		let _loadedMediaObj = document.querySelector('#loadedMediaObj');
		if(_loadedMediaObj) {
			endVidPos.value=_loadedMediaObj.currentTime;
		}
	});

    const loadMedia  = (url) => new Promise((resolve, reject) => {
        var mediaObj = document.createElement('video');
        mediaObj.addEventListener('canplay', () => resolve(mediaObj));
        mediaObj.addEventListener('error', (err) => reject(err));
        mediaObj.src = url;
    });
    const loadImage = (url) => new Promise((resolve, reject) => {
	  const img = new Image();
	  img.addEventListener('load', () => resolve(img));
	  img.addEventListener('error', (err) => reject(err));
	  img.src = url;
	});

    const acceptedFileTypes = ['.mp4', '.webm', '.avi', '.mpeg', '.flv', '.mov', '.3gp'];
    const fileFormatErr = '⚠ 𝗨𝗽𝗹𝗼𝗮𝗱𝗲𝗱 𝗳𝗶𝗹𝗲 𝘁𝘆𝗽𝗲 𝗶𝘀 𝗻𝗼𝘁 𝘀𝘂𝗽𝗽𝗼𝗿𝘁𝗲𝗱. 𝗟𝗶𝘀𝘁 𝗼𝗳 𝘀𝘂𝗽𝗽𝗼𝗿𝘁𝗲𝗱 𝗳𝗶𝗹𝗲 𝗳𝗼𝗿𝗺𝗮𝘁𝘀 𝗮𝗿𝗲:' + '\n' +
        '◾ .𝗆𝗉𝟦' + '\n' +
        '◾ .𝗐𝖾𝖻𝗆' + '\n' +
        '◾ .𝖺𝗏𝗂' + '\n' +
        '◾ .𝗆𝗉𝖾𝗀' + '\n' +
        '◾ .𝖿𝗅𝗏' + '\n' +
        '◾ .𝗆𝗈𝗏' + '\n' +
        '◾ .𝟥𝗀𝗉' + '\n' +
        '𝘗𝘭𝘦𝘢𝘴𝘦 𝘵𝘳𝘺 𝘢𝘨𝘢𝘪𝘯.';

    const fileSizeErr = '⚠ 𝗨𝗽𝗹𝗼𝗮𝗱𝗲𝗱 𝗳𝗶𝗹𝗲 𝘀𝗵𝗼𝘂𝗹𝗱 𝗻𝗼𝘁 𝗲𝘅𝗰𝗲𝗲𝗱 𝟮𝗚𝗕.' + '\n' +
        '𝘗𝘭𝘦𝘢𝘴𝘦 𝘵𝘳𝘺 𝘢𝘨𝘢𝘪𝘯.';

    const vidDurationErr = '⚠ 𝗩𝗶𝗱𝗲𝗼 𝗹𝗲𝗻𝗴𝘁𝗵 𝘀𝗵𝗼𝘂𝗹𝗱 𝗻𝗼𝘁 𝗲𝘅𝗰𝗲𝗲𝗱 𝟲𝟬 𝘀𝗲𝗰𝗼𝗻𝗱𝘀.' + '\n' +
        '𝘗𝘭𝘦𝘢𝘴𝘦 𝘵𝘳𝘺 𝘢𝘨𝘢𝘪𝘯.';

    // Uint8Array to Base64
    const convertBitArrtoB64 = (bitArr) => (btoa(bitArr.reduce((data, byte) => data + String.fromCharCode(byte), '')));
    // Base64 to Uint8Array
    const convertB64ToBitArr = (b64Str) => (Uint8Array.from(atob((b64Str.includes(';base64,') ? (b64Str.split(','))[1] : b64Str)), (v) => v.charCodeAt(0)));

    const dropFileZone = document.querySelector('#dropFileZone');
    const dropFileInnerZone = dropFileZone.querySelector('.card-body');

    const clearCache = document.querySelector('#clearCache');
    clearCache.addEventListener('click', async() => {
        requestAnimationFrame(async() => {
            localStorage.clear();
            sessionStorage.clear();
            const response =await indexedDB.databases();
            console.log(response);
            for(let obj of response) {
                indexedDB.deleteDatabase(obj.name);
            }

            location.reload();
        });
    });

   	const popoverTargets = document.querySelectorAll('[data-content]');
    Array.from(popoverTargets).map(
        popTarget => new BSN.Popover(popTarget, {
            placement: 'right',
            animation: 'show',
            delay: 100,
            dismissible: true,
            trigger: 'click'
        })
    );

    const elementsTooltip = document.querySelectorAll('[title]');
    Array.from(elementsTooltip).map(
        tip => new BSN.Tooltip(tip, {
            placement: 'top', //string
            animation: 'slideNfade', // CSS class
            delay: 150, // integer
        })
    );

    const tabTargets = document.querySelectorAll('#initTabs .nav-link');
    Array.from(tabTargets).map(
        tab => new BSN.Tab(tab, {
            height: true
        })
    );

    if (!window.FileReader) {
        errorDisplay.innerHTML = '<span class=\'emoji\'>⛔</span> WARNING: Your browser does not support HTML5 \'FileReader\' function required to open a file.';
        return;
    }
    if (!window.Blob) {
        errorDisplay.innerHTML = '<span class=\'emoji\'>⛔</span> WARNING: Your browser does not support HTML5 \'Blob\' function required to save a file.';
        return;
    }

    // IE8
    // IE9+ and other modern browsers
    function triggerEvent(el, type) {
        let e = (('createEvent' in document) ? document.createEvent('HTMLEvents') : document.createEventObject());
        if ('createEvent' in document) {
            e.initEvent(type, false, true);
            el.dispatchEvent(e);
        } else {
            e.eventType = type;
            el.fireEvent('on' + e.eventType, e);
        }
    }

    function htmlToElement(html) {
        let documentFragment = document.createDocumentFragment();
        let template = document.createElement('template');
        template.innerHTML = html.trim();
        for (let i = 0, e = template.content.childNodes.length; i < e; i++) {
            documentFragment.appendChild(template.content.childNodes[i].cloneNode(true));
        }
        return documentFragment;
    }

 	const infoModalBtn = document.querySelector('#infoModalBtn');
    const infoModalContent = `<div class="modal-header pb-0 border-0">
                                <h5 class="modal-title"><span class='mr-2 font-weight-bolder symbol text-center'>𝖎</span> About</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                              </div>
                              <div class="modal-body pt-0 pb-0">
                                <div class="text-center">
                                    <img src='img/logo.png' height='35' />
                                    <p class='lead pb-1'>Converts Video to GIF with jsgif</p>
                                    <p class='text-custom-one mb-0'><strong>Encodes</strong> video files into animated GIFs using JavaScript library (<a href='https://github.com/antimatter15/jsgif)' target='_blank'>jsgif</a>) which runs entirely in-browser.</p>
                                    <span class='symbol mr-1 font-weight-bold'>⇒</span><mark class='emoji'>🚫 No internet or server required.</mark>
                                </div>
                                <p class='small secondary mt-1'>Originally inspired by 🎞 📽 <a href="https://ezgif.com/video-to-gif" target="_blank">video to animated GIF converter</a> and a revamp of previous implementation at <a href="https://github.com/incubated-geek-cc/video-to-GIF" target="_blank">video-to-GIF</a> (refer to more details <a href='https://geek-cc.medium.com/video-to-gif-conversion-with-client-side-javascript-decoding-fps-for-gif-bf96b8bc4d7c' target='_blank'>here</a>).</p>
                               
                                <hr class="mt-1">
                                <div class="text-left">
                                    <h6><span class='emoji'>🏆</span> Credits & Acknowledgements</h6>
                                    <p>Application uses <cite title="A javascript plugin to encode HTML5 canvas frames into animated GIF files entirely in-browser."><a href="https://github.com/antimatter15/jsgif" target="_blank">jsgif</a></cite> plugin (<a href="LICENSE.txt" target="_blank">MIT licensed</a>) by creator <a href="https://github.com/antimatter15" target="_blank">Kevin Kwok</a>.</p>
                                </div>
                              	</div>
                              	<div class="modal-footer text-right">
                                <small><span class='symbol pl-1 pr-1'><a href='https://www.buymeacoffee.com/geekcc' target='_blank'><img src='img/buy_me_a_taco.png' height='26' /></a> </span><a href="https://medium.com/@geek-cc" target="_blank" class="small"><span class="symbol">~ ξ(</span><span class="emoji">🎀</span><span class="symbol">˶❛◡❛) ᵀᴴᴱ ᴿᴵᴮᴮᴼᴺ ᴳᴵᴿᴸ</span></a> 
                                </small> <span class='symbol text-custom-one'>❘</span> <span class='symbol pl-1 pr-1'><a href='https://github.com/incubated-geek-cc/' target='_blank'><span data-profile='github' class='attribution-icon'></span></a>▪<a href='https://medium.com/@geek-cc' target='_blank'><span data-profile='medium' class='attribution-icon'></span></a>▪<a href='https://www.linkedin.com/in/charmaine-chui-15133282/' target='_blank'><span data-profile='linkedin' class='attribution-icon'></span></a>▪<a href='https://twitter.com/IncubatedGeekCC' target='_blank'><span data-profile='twitter' class='attribution-icon'></span></a> </span>
                              </div>`;


  	const loadingSignalHTML = '<span class="spinner-border spinner-border-sm mr-1"></span><span class="text-white symbol">𝖫𝗈𝖺𝖽𝗂𝗇𝗀…</span>';
  	const nonLoadingSignalHTML = '𝖢𝗈𝗇𝗏𝖾𝗋𝗍‼';

    async function showLoadingSignal(modalTitle) {
        let modalHeader = '<div class="modal-header"><h5 class="modal-title">' + modalTitle + '</h5></div>';
        const modalContent = `<div class="modal-body">
                                <div class="row">
                                    <div class="col-sm-12 text-center">
                                        <div class="spinner-border text-muted"></div>
                                        <div class="text-secondary symbol">𝖫𝗈𝖺𝖽𝗂𝗇𝗀…</div>
                                    </div>
                                </div>
                              </div>`;

        siteModalInstance.setContent(modalHeader + modalContent);
        await new Promise((resolve, reject) => setTimeout(resolve, 100)); // wait 100 milliseconds
        siteModalInstance.show();
        runBtn.innerHTML = loadingSignalHTML;
        runBtn.disabled=true;
        return await Promise.resolve('Loading');
    }
    const siteModalInstance = new BSN.Modal(
        '#siteModal', {
            content: '',
            backdrop: false,
            keyboard: false
        }
    );
    infoModalBtn.addEventListener('click', async() => {
        siteModalInstance.setContent(infoModalContent);
        await new Promise((resolve, reject) => setTimeout(resolve, 100));
        siteModalInstance.toggle();
    });
    triggerEvent(infoModalBtn, 'click');

    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            let fileredr = new FileReader();
            fileredr.onload = () => resolve(fileredr.result);
            fileredr.onerror = () => reject(fileredr);
            fileredr.readAsArrayBuffer(file);
        });
    }
    const upload = document.querySelector('#upload');
    upload.addEventListener('click', (ev) => {
        ev.currentTarget.value = '';
    });
    dropFileZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropFileInnerZone.classList.add('bg-custom-two-05');
    });
    dropFileZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropFileInnerZone.classList.remove('bg-custom-two-05');
    });
    dropFileZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropFileInnerZone.classList.add('bg-custom-two-05');
    });


    async function importDBFile(file) {
    	try {
	    	let fileName=file.name;
			let fileType=file.type;
			let fileSizeInKB=parseInt(file.size/1024);
			let fileSizeInMB=((file.size/1024)/1024).toFixed(2);

			if(fileSizeInMB>2000) {
				alert(fileSizeErr);
				return;
			}
	        let ext = fileName.substr(fileName.lastIndexOf('.')); 
	        if (!acceptedFileTypes.includes(ext)) {
	            alert(fileFormatErr);
	            return;
	        }
	        let arrayBuffer = await readFileAsArrayBuffer(file);
            let uInt8Array = new Uint8Array(arrayBuffer);
            /* TO DO: Preview Video */
			let b64Str = convertBitArrtoB64(uInt8Array);
			let encodedData=`data:${file.type};base64,${b64Str}`;

			_loadedMediaObj=await loadMedia(encodedData);
			let vidDuration=_loadedMediaObj.duration;
			if(vidDuration>=61) { // One way to do this is by assigning a variable, that stores the object, null. 
				displayedWidth = void 0; // = undefined;
				displayedHeight = void 0; // = undefined;
				mediaObjWidth = void 0; // = undefined;
				mediaObjHeight = void 0; // = undefined;

				_canvas = void 0; // = undefined;
				_zoom_factor=1.0;
				_gif = void 0; // = undefined;
				_loadedMediaObj = void 0; // = undefined;

				alert(vidDurationErr);
				return;
			}

			startVidPos.value = 0.0;
			startVidPos.min = 0.0;
			startVidPos.max= vidDuration;

			endVidPos.value = vidDuration;
			endVidPos.min = 0.0;
			endVidPos.max= vidDuration;

			_loadedMediaObj.setAttribute('controls','');
			_loadedMediaObj.id='loadedMediaObj';
			_loadedMediaObj.autoplay=false;
			_loadedMediaObj.muted=true;
			_loadedMediaObj.loop=false;
			await new Promise((resolve, reject) => setTimeout(resolve, 50));

			mediaObjHeight=_loadedMediaObj.videoHeight;
			mediaObjWidth=_loadedMediaObj.videoWidth;

			vidH=mediaObjHeight;
    		vidW=mediaObjWidth;
    		_canvas=document.createElement('canvas');
    		scaleCanvas(_canvas, _loadedMediaObj, _zoom_factor, vidH, vidW, scale);

			gifWidth.disabled=false;
			gifHeight.disabled=false;

			gifWidth.value = mediaObjWidth;
			gifWidth.max = mediaObjWidth;

			gifHeight.value = mediaObjHeight;
			gifHeight.max = mediaObjHeight;

			let scaleRatio=parseFloat(displayedLengthVal/mediaObjHeight);
			_zoom_factor = scaleRatio;

			displayedHeight=scaleRatio*mediaObjHeight;
			displayedWidth=scaleRatio*mediaObjWidth;
			_loadedMediaObj['style']['height']=`${displayedHeight}px`;
			_loadedMediaObj['style']['width']=`${displayedWidth}px`;

			scaleCanvas(_canvas, _loadedMediaObj, _zoom_factor, displayedHeight, displayedWidth, scale);
			await new Promise((resolve, reject) => setTimeout(resolve, 50));

			let vidDetailsStr = `<p class='col-sm-12 mb-0 mt-0 ml-1 mr-1 p-0 w-100 nowrap custom-scrollbar' style='height: 2.0rem;overflow-x: auto;overflow-y: hidden;'>` + [
				`<span class='emoji'>🎞️</span><span class='nowrap pl-1 pr-1 m-0'><small id='FileName'>${fileName}</small></span>`,
				`<span class='nowrap pl-1 pr-1 m-0'><small id='FileType'>${fileType}</small></span>`,
				`<span class='nowrap pl-1 pr-1 m-0'><small id='FileSize'>${fileSizeInMB} <strong class='symbol'>𝙼𝙱</strong></small></span>`,
				`<span class='emoji'>⏳</span><span class='nowrap pl-1 pr-1 m-0'><small id='VidDuration'>${vidDuration} <strong class='symbol'>𝚜</strong></small></span>`,
				`<span class='emoji'>📐</span><span class='nowrap pl-1 pr-1 m-0'><small id='VidDim'>${mediaObjWidth}<span class='unicode'>ᵖˣ</span> × ${mediaObjHeight}<span class='unicode'>ᵖˣ</span></small></span>`
			].join(' │ ') + `</p>`;
			const vidDetails = htmlToElement(vidDetailsStr);
			
			mediaWrapper.appendChild(_loadedMediaObj);
			mediaWrapper.appendChild(vidDetails);

			triggerEvent(gifWidth, 'change');
        } catch (err) {
            errorDisplay.innerHTML = `<span class='emoji'>⚠</span> ERROR: ${err.message}`;
            console.log(err);
        } finally {
            upload.setAttribute('disabled', '');
            upload.classList.add('no-touch');
            upload.classList.add('unselectable');

            dropFileZone.setAttribute('hidden', '');
            mainWrapper.removeAttribute('hidden');

            triggerEvent(window, 'resize');
        }
        return await Promise.resolve('success');
    }

    dropFileZone.addEventListener("drop", async(e) => {
        e.preventDefault();
        e.stopPropagation();
        dropFileInnerZone.classList.remove("bg-custom-two-05");
        upload.value = '';

        let draggedData = e.dataTransfer;
        let file = draggedData.files[0];
        if (!file) return;
		
        await importDBFile(file);
    }); // drop file change event

    upload.addEventListener('change', async(evt) => {
        const file=evt.currentTarget.files[0];
		if (!file) return;
        await importDBFile(file);
    }); // upload file change event

    saveOutputBtn.addEventListener('click', async()=> {
      let dwnlnk = document.createElement('a');

      let fileName = document.querySelector('#FileName').innerHTML;
      let outputFileExt = '.gif';
      let saveFilename = fileName.substr(0, fileName.lastIndexOf('.'));
      dwnlnk.download = `${formatedFileTimestamp()}_${_gif.naturalWidth}x${_gif.naturalHeight}_${saveFilename}${outputFileExt}`;
      dwnlnk.href = `${saveOutputBtn.value}`;
      dwnlnk.click();
    });

    // ================================== Query Editor Tab ===========================
    window.addEventListener('resize', (evt) => {
        setHeights();
    });
    triggerEvent(window, 'resize');


    async function renderGIF() {
        try {
            await generateGIF(renderGIFContainer);
            setHeights();
        } catch (err) {
            errorDisplay.innerHTML = `<span class='emoji'>⚠</span> ERROR: ${err.message}`;
            console.log(err);
        }
    }

    function resizeMediaObj() {
    	let _loadedMediaObj = document.querySelector('#loadedMediaObj');
    	let mediaWrapper = document.querySelector('#mediaWrapper');

		if(_loadedMediaObj && mediaWrapper) {
	    	mediaObjHeight=_loadedMediaObj.videoHeight;
			mediaObjWidth=_loadedMediaObj.videoWidth;

			mediaObjHeight=_loadedMediaObj.videoHeight;
			mediaObjWidth=_loadedMediaObj.videoWidth;
			
			const wrapperWidth=mediaWrapper.clientWidth;
			mediaWrapper['style']['width'] = `calc(${wrapperWidth}px - 1rem)`;
			const tempWidth = mediaWrapper.clientWidth;
			mediaWrapper['style']['width'] = '';

			let scaleRatio=parseFloat(displayedLengthVal/mediaObjHeight);
			let displayedHeight=scaleRatio*mediaObjHeight;
			let displayedWidth=scaleRatio*mediaObjWidth;
			if(displayedWidth>tempWidth) {
				scaleRatio=parseFloat(tempWidth/mediaObjWidth);
				displayedHeight=scaleRatio*mediaObjHeight;
				displayedWidth=scaleRatio*mediaObjWidth;
			}
			_loadedMediaObj['style']['height']=`${displayedHeight}px`;
			_loadedMediaObj['style']['width']=`${displayedWidth}px`;

			let heightDiff=(displayedLengthVal-displayedHeight);
			mediaWrapper['style']['height']=`calc(${displayedLengthVal-heightDiff}px + 3.5rem)`; 

			if(_gif) {
			    _gif['style']['width']=`${displayedWidth}px`;
			    _gif['style']['height']=`${displayedHeight}px`;
		    }
		}
    }

    function setHeights() {
        const mediaWrapper = document.querySelector('#mediaWrapper');
        const errorDisplay = document.querySelector('#errorDisplay');
        resizeMediaObj();

        const innerWrapper=document.querySelector('div.card-body.rounded-0.p-1.h-100');
        let cssHeight = innerWrapper.clientHeight - mediaWrapper.clientHeight - errorDisplay.clientHeight - 8;
        renderGIFContainer['style']['height'] = `calc(${cssHeight}px - 3.5rem - 2.5em - 2.375rem)`;
    }

    async function extractFramesFromVideo(gifEncoder) {
	  	return new Promise(async (resolve) => { 
		    let video = document.querySelector('#loadedMediaObj');
		    
		    let seekResolve;
		    video.addEventListener('seeked', async function() {
		      if(seekResolve) {
		      	seekResolve();
		      }
		    });

		    video.addEventListener('play', async function(e) {
		    	gifEncoder.start();
		    	
				let cWidth = gifWidth.valueAsNumber;
				let cHeight = gifHeight.valueAsNumber;

				let startTime = parseFloat(startVidPos.value);
				let endTime = parseFloat(endVidPos.value);
				let gifDuration = (endTime - startTime);

				staticFrames = [];
				let interval = 1 / fps;
				let currentTime = startTime; // 0
				let duration = gifDuration; //video.duration;

				while(currentTime <= duration) {
					try {
						video.currentTime = currentTime;
						await new Promise(r => seekResolve=r);
						_loadedMediaObj=video;
						reverseScaleCanvas(_canvas, _loadedMediaObj, _zoom_factor, cHeight, cWidth, scale);
						gifEncoder.addFrame(_canvas.getContext('2d', { alpha: false }));
						let frameB64Str = _canvas.toDataURL();
						let staticFrame =  `<small class='symbol small nowrap'>🇫🇷🇦🇲🇪 ⌗<small class='small'>${frameIndex++}</small></small><br><img src=${frameB64Str} width='55'>`;
						staticFrames.push(staticFrame);
					} catch(err) {
						errorDisplay.innerHTML = `<span class='emoji'>⚠</span> ERROR: ${err.message}`;
						console.log(err);
					}
					currentTime += interval;
				}
		      	resolve(staticFrames);
		    });
	 	});
	}

	async function generateGIF(renderGIFEle) {
        try {
            let status = await showLoadingSignal('Rendering GIF');
            console.log(status);

            if(renderGIFEle.children.length > 1) {
            	renderGIFContainer.removeChild(renderGIFContainer.children[0]);
            	renderGIFContainer.removeChild(renderGIFContainer.children[0]);
                renderGIFContainer.removeChild(renderGIFContainer.children[0]);
            }
            frameIndex=0;
            staticFrames=[];
            errorDisplay.innerHTML = '';
            saveOutputBtn.setAttribute('hidden', '');
            /* TO DO */
            /* LOAD AND PREVIEW GIF */
            let fileName = document.querySelector('#FileName').innerHTML;
            let outputFileExt = '.gif';
            let outputFileMimeType = 'image/gif';
            let outputFileName = fileName.substr(0, fileName.lastIndexOf('.'));

            let startTime = parseFloat(startVidPos.value);
			let endTime = parseFloat(endVidPos.value);
			let gifDuration = (endTime - startTime);

            /* TO DO: Add frames */
            // init encoder
            const encoder = new GIFEncoder(gifWidth.valueAsNumber, gifHeight.valueAsNumber); 
		    encoder.setRepeat(0);
		    encoder.setFrameRate(fps);
			encoder.setQuality(adjustQualitySlider.valueAsNumber); // [1,30] | Best=1 | >20 not much speed improvement. 10 is default.

			_loadedMediaObj.play();
        	const frames = await extractFramesFromVideo(encoder);
			encoder.finish();

			let readableStream=encoder.stream();
	        let bitArr=new Uint8Array(readableStream.bin);
			let encodedData=`data:${outputFileMimeType};base64,${convertBitArrtoB64(bitArr)}`;
			let outputFileSize = bitArr.length*byteToKBScale;
			let outputfileSizeInMB=(outputFileSize/1024).toFixed(2);

			saveOutputBtn.disabled=false;
			saveOutputBtn.value=encodedData;
            saveOutputBtn.removeAttribute('hidden');

			_gif = await loadImage(encodedData);
			let vidH=_gif.naturalHeight;
		    let vidW=_gif.naturalWidth;
		    _gif['style']['width']=`${vidW}px`;
		    _gif['style']['height']=`${vidH}px`;

		    let gifDetailsStr = `<p class='col-sm-12 mb-0 mt-0 ml-1 mr-1 p-0 w-100 nowrap custom-scrollbar' style='height: 2.0rem;overflow-x: auto;overflow-y: hidden;'>` + [
				`<span class='emoji'>🖼️</span><span class='nowrap pl-1 pr-1 m-0'><small id='OutputFileName'>${outputFileName}${outputFileExt}</small></span>`,
				`<span class='nowrap pl-1 pr-1 m-0'><small id='OutputFileType'>${outputFileMimeType}</small></span>`,
				`<span class='nowrap pl-1 pr-1 m-0'><small id='OutputFileSize'>${outputfileSizeInMB} <strong class='symbol'>𝙼𝙱</strong></small></span>`,
				`<span class='emoji'>⏳</span><span class='nowrap pl-1 pr-1 m-0'><small id='GIFDuration'>${gifDuration} <strong class='symbol'>𝚜</strong></small></span>`,
				`<span class='emoji'>📐</span><span class='nowrap pl-1 pr-1 m-0'><small id='GIFDim'>${vidW}<span class='unicode'>ᵖˣ</span> × ${vidH}<span class='unicode'>ᵖˣ</span></small></span>`,
				`<span class='emoji'>🎞️</span><span class='nowrap pl-1 pr-1 m-0'><small id='GIFFrames' class='font-weight-bold'>${(frameIndex)}</small> frames</span>`
			].join(' │ ') + `</p>`;
			const gifDetails = htmlToElement(gifDetailsStr);

			let framesHTML5 = htmlToElement(`<table class="m-1 p-1 table-responsive table-responsive-sm border custom-scrollbar w-100 h-25 text-center"><tr><th>${staticFrames.join('</th><th>')}</th></tr></table>`);
			renderGIFEle.prepend(framesHTML5);
			renderGIFEle.prepend(gifDetails);
		    renderGIFEle.prepend(_gif);
            
            await new Promise((resolve, reject) => setTimeout(resolve, 100));
            siteModalInstance.hide();
            runBtn.innerHTML = nonLoadingSignalHTML;
            runBtn.disabled=false;
            await new Promise((resolve, reject) => setTimeout(resolve, 100));
            return await Promise.resolve('success');
        } catch (err) {
            errorDisplay.innerHTML = `<span class='emoji'>⚠</span> ERROR: ${err.message}`;
            console.log(err);
        }
    }

	runBtn.addEventListener('click', async(e) => {
        try {
        	_loadedMediaObj.removeAttribute('controls');
        	_zoom_factor = gifHeight.valueAsNumber/mediaObjHeight;
        	renderGIF();
        } catch (err) {
            errorDisplay.innerHTML = `<span class='emoji'>⚠</span> ERROR: ${err.message}`;
            console.log(err);
        }
    });

    

    
    // function resetAll() {
    //  if(renderGIFEle.children.length > 1) {
    //      renderGIFContainer.removeChild(renderGIFContainer.children[0]);
    //      renderGIFContainer.removeChild(renderGIFContainer.children[0]);
    //      renderGIFContainer.removeChild(renderGIFContainer.children[0]);
    //     }
    //     frameIndex=0;
    //     staticFrames='';
    //     errorDisplay.innerHTML = '';
    //     saveOutputBtn.setAttribute('hidden', '');

    //     _canvas=void 0;
    //     _loadedMediaObj=void 0;
    //     _gif=void 0;
    //     _zoom_factor=1.0;
    //     vidH=0;
    //     vidW=0;
    //     displayedWidth=void 0;
    //     displayedHeight=void 0;
    //     mediaObjWidth=void 0;                    console.log(err);
    //     mediaObjHeight=void 0;
    // }

}); // DOMContentLoaded