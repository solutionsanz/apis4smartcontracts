var GsDraggable = function(elementId, dragOptions){
	var container = document.getElementById(elementId),
		dragElements = container.querySelectorAll('li'),  
		saveList = dragOptions.save || true,
		initialOrder = dragOptions.initialOrder || false,
		onSave = dragOptions.onSave || function (){ return ''; },
		sendToPhp = dragOptions.sendToPhp || false,
		sendToPhpUrl = dragOptions.sendToPhpUrl || '',
		onAjaxComplete = dragOptions.onAjaxComplete || function(){ return '';}, 					
   		onAjaxFailure = dragOptions.onAjaxFailure || function(){ return '';},   
		addItems = container.parentNode.querySelector('.gs-add-item') || false,
		requiresHandlers = dragOptions.useHandler || false, // if set to true, only handlers will be used for drag and drop. Defaults to FALSE
		generateHandler = dragOptions.generateHandler || false, // if set to true, the script will automatically generate handlers. Defaults to FALSE
		handlerClass = dragOptions.handlerClass || 'gs-handler',  // the class name for the handler. Defaults to 'gs-hadler'
		editItem = dragOptions.editItem || false,
		deleteItem = dragOptions.deleteItem || false,
		randomId = makeid(),

		elementsObject = [],
		dragPosition, saveButton, childHandler = '', childHandlerContent = '', inputOverlay,
		localStorageObject = [],
		allImages = container.getElementsByTagName('img'),
		newItem, newItemObject =[], editButton, deleteButton;
		container.className += (container.className ? ' ' : '') + 'gs-draggable';
		
	//Set All images to not be draggable	
	for (var i=0; i<allImages.length; i++) {
		allImages[i].setAttribute('draggable', 'false');
	}
	//End set images

	//generates a random id
	function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

	// function to check if the user uses IE 10 or lower
	function isInternetExplorer() {
	    var b = document.createElement('B'),
	        d = document.documentElement,
	        isInternetExplorer;

	    b.innerHTML = '<!--[if lte IE 11]><b id="gsietest"></b><![endif]-->';
	    d.appendChild(b);
	    isInternetExplorer = !!document.getElementById('gsietest');
	    d.removeChild(b);
	    return isInternetExplorer;
	}

	function getIEVersion() {
	    var agent = navigator.userAgent;
	    var reg = /MSIE\s?(\d+)(?:\.(\d+))?/i;
	    var matches = agent.match(reg);

	    if (matches != null) {
	        return matches[1] == 10;
	    }
	    return false;
	}

	function getIndexNo(elem) {
		var i = 0;
		while( (elem = elem.previousSibling) != null ) {
			i++;
		}

		return i;
	}

	function dragStartElement(e){
		if (e.target.tagName.toLowerCase === 'li') e.stopPropagation();
		e.target.className += ' element-to-move';
		e.dataTransfer.effectAllowed='move';
		e.dataTransfer.setData("text", e.target.id);
		window.localStorage.selectedElement = e.target.id;
		dragPosition = e.clientY;
		dragIndex = getIndexNo(e.target);
	}

	function dragEnterElementIE(e) {
		e.stopPropagation();

		if (getIndexNo(e.target) === dragIndex) {
			return;
		}

		var currentElem = window.localStorage.selectedElement,  
			movedElem = container.querySelector('#'+currentElem);

		if (e.currentTarget.id != currentElem) {
			switchElementsIE(movedElem, e.currentTarget);
			dragIndex = getIndexNo(container.querySelector('#' + currentElem));
		}

	}
	
	function dragEnterElement(e){
		e.stopPropagation();

		if (e.clientY === dragPosition) {
			return;
		}

		var currentElem = window.localStorage.selectedElement,  
			movedElem = container.querySelector('#'+currentElem);
		if (e.currentTarget.id != currentElem) {
			if (e.clientY < dragPosition) {
				switchElements(e.currentTarget, movedElem);
			} else {
				switchElements(movedElem, e.currentTarget);
			}
			dragPosition = e.clientY;
		}
	}
	
	function dragOverElement(e){
		e.stopPropagation();
		this.style.borderStyle = 'dashed';
		e.preventDefault();
		return false;
	}
	
	function dragLeaveElement(e){
		e.stopPropagation();
	}
	
	function dragDropElement(e){
		e.stopPropagation();
		e.preventDefault();
		var currentElem = window.localStorage.selectedElement,
		movedElem = container.querySelector('#'+currentElem);
		if (e.currentTarget.id != currentElem) {
			if (e.clientY < dragPosition) {
				movedElem.className = movedElem.className.replace(' element-to-move','')
				e.target.parentNode.insertBefore(movedElem, e.target);
			} else {
				movedElem.className = movedElem.className.replace(' element-to-move','')
				e.target.parentNode.insertBefore(movedElem, e.target.nextSibling);
			}
		} else {
		   movedElem.className = movedElem.className.replace(' element-to-move','');
		}
		this.style.borderStyle = 'solid';
		return false;
	}
	
	function dragEndElement(e) {
		e.stopPropagation();
		e.preventDefault();
		e.target.className = e.target.className.replace(' element-to-move','');
		if (requiresHandlers) {
			e.target.setAttribute('draggable', 'false')
		}
	}
	//Create actions
	for (var i=0; i<dragElements.length; i++) {
		dragElements[i].setAttribute('id', 'dragged-element' + randomId + '-' +dragElements[i].getAttribute('data-id'));
		dragElements[i].querySelector('input').setAttribute('name', 'dragged-element'+dragElements[i].getAttribute('data-id'));
		dragElements[i].setAttribute('draggable', requiresHandlers ? 'false' : 'true');
		dragElements[i].addEventListener('dragstart', dragStartElement);
		dragElements[i].addEventListener('dragenter', getIEVersion() ? dragEnterElementIE : dragEnterElement)
		dragElements[i].addEventListener('dragleave', dragLeaveElement);
		dragElements[i].addEventListener('dragover', dragOverElement);
		dragElements[i].addEventListener('dragend', dragEndElement);
		dragElements[i].addEventListener('drop', dragDropElement);
	}
	//End create actions
	
	//Save functionality
	if (saveList){
		saveButton = document.createElement('a');
		saveButton.className = 'gs-save';
		saveButton.setAttribute('href', 'javascript:;');
		saveButton.innerHTML = 'Create';
		container.parentNode.appendChild(saveButton);
		saveButton.addEventListener('click', function(){
			onSave();
			initialObject();
			window.localStorage[elementId] = JSON.stringify(objectParse(elementsObject));

				//window.alert("Pushed!");
				handleContract(objectParse(elementsObject));

				//Send list to PHP
				// if (sendToPhp) {
				// 	var sendList = new XMLHttpRequest();
				// 		sendList.open('POST', sendToPhpUrl);
				// 		sendList.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				// 		sendList.send('data='+JSON.stringify(objectParse(elementsObject)));
				// 		sendList.onreadystatechange = function(){ 
				// 			if (sendList.readyState === 4 && sendList.status === 200) {
				// 				onAjaxComplete();
				// 			} else {
				// 				onAjaxFailure();
				// 			}
				// 		}
				// }
				//End send list to PHP				

		});
		if (window.localStorage[elementId] !== undefined){ 
			for ( var i=0; i<JSON.parse(window.localStorage[elementId]).length; i++) {
				localStorageObject.push(
				JSON.parse(window.localStorage[elementId])[i].id
				)
			}
			initalSort(localStorageObject);
		}
	}
	//End save functionality

	//Generate list
	if (initialOrder && window.localStorage[elementId] === undefined) {
        initalSort(dragOptions.initialOrder); 
    } else {
        initialOrder = [];
        for (i=0; i<dragElements.length; i++){
            initialOrder.push(i);
        }
        initalSort(initialOrder)
    }  
	//End Generate list
	initialObject();
	
	//Add Edit button
	function AddEditItems(element) {
		for (var i=0; i<element.length; i++){
			editButton = document.createElement('a');
			editButton.setAttribute('href','javascript:;');
			editButton.className = 'gs-edit-item';
			editButton.innerHTML = 'Edit';
			editButton.addEventListener('click', function(e){
				if (e.target.className.indexOf("gs-edit-active") == -1) {
					e.target.className += ' gs-edit-active';
					e.target.innerHTML = 'Save';
					e.target.parentNode.querySelector('input').focus();
					e.target.parentNode.querySelector('input').removeAttribute('readonly');
					e.target.parentNode.querySelector('input').removeAttribute('disabled');
					e.target.parentNode.querySelector('input').style.cursor = 'auto';
					e.target.parentNode.querySelector('input').focus();
					e.target.parentNode.querySelector('.gs-overlay').style.display = 'none';
				} else {
					e.target.className = e.target.className.replace(' gs-edit-active', '');
					e.target.innerHTML = 'Edit';
					e.target.parentNode.querySelector('input').readOnly = true;
					e.target.parentNode.querySelector('input').disabled = true;
					e.target.parentNode.querySelector('input').style.cursor = 'move';
					e.target.parentNode.querySelector('.gs-overlay').style.display = 'block';
				}
				
				//elementsObject.splice(e.target.parentNode.getAttribute('data-rel'), 1);
				//e.target.parentNode.remove();
			});
			element[i].appendChild(editButton);
		}
	}
	//Add Edit button
	
	//Add Delete button
	function AddDeleteItems(element) {
		for (var i=0; i<element.length; i++){
			deleteButton = document.createElement('a');
			deleteButton.setAttribute('href','javascript:;');
			deleteButton.className = 'gs-delete-item';
			deleteButton.innerHTML = 'Delete';
			deleteButton.addEventListener('click', function(e){
				elementsObject.splice(e.target.parentNode.getAttribute('data-rel'), 1);
				e.target.parentNode.remove();
			});
			element[i].appendChild(deleteButton);
		}
	}
	//Add Delete button
	
	//Add Items
	if (addItems){
		var addItemButton = addItems.querySelector('a');
		addItemButton.addEventListener('click', function(){
			if (this.parentNode.querySelector('input').value != '') {
				newItem = document.createElement('li');
				newItem.setAttribute('draggable','true');
				newItem.innerHTML = '<div class="gs-overlay"></div><input type="text" value="'+this.parentNode.querySelector('input').value+'" name="'+'dragged-element'+elementsObject.length+'" readonly disabled>'
				this.parentNode.querySelector('input').value = '';
				newItem.setAttribute('data-id', elementsObject.length);
				newItem.setAttribute('data-rel', elementsObject.length);
				newItem.setAttribute('id', 'dragged-element' + randomId + '-' +elementsObject.length);
				newItem.addEventListener('dragstart', dragStartElement);
				newItem.addEventListener('dragenter', getIEVersion() ? dragEnterElementIE : dragEnterElement)
				newItem.addEventListener('dragleave', dragLeaveElement);
				newItem.addEventListener('dragover', dragOverElement);
				newItem.addEventListener('dragend', dragEndElement);
				newItem.addEventListener('drop', dragDropElement);
				container.appendChild(newItem);
				container.parentNode.querySelector('.gs-error-message').style.display = 'none';
				elementsObject.push({
					'element': newItem,
					'dept': '0'
				});
                newItemObject = [];
                newItemObject.push(newItem);
                AddEditItems(newItemObject);
                AddDeleteItems(newItemObject);
                generateHandlers(newItem);
			} else {
				container.parentNode.querySelector('.gs-error-message').style.display = 'block';
			}
		});
		
	}
	//End Add Items

	//Switch elements
	function switchElements(elem1, elem2){
		var aux = elementsObject[parseInt(elem1.getAttribute('data-rel'), 10)],
			auxDataRel = parseInt(elem1.getAttribute('data-rel'), 10),
			element1Bound, element2Bound;

		elementsObject[parseInt(elem1.getAttribute('data-rel'), 10)] = elementsObject[parseInt(elem2.getAttribute('data-rel'), 10)];
		elementsObject[parseInt(elem2.getAttribute('data-rel'), 10)] = aux;
		elem1.setAttribute('data-rel', elem2.getAttribute('data-rel'));
		elem2.setAttribute('data-rel', auxDataRel);
		elem1.parentNode.insertBefore(elem2, elem1);
		elem1.style.top = '-40px';
		elem1.style.transition = 'top 150ms';
		elem2.style.top = '40px';
		elem2.style.transition = 'top 150ms';
	
		elem1.offsetWidth;
		elem2.offsetWidth;
	
		elem1.style.top = '0px';
		elem2.style.top = '0px';
	
		setTimeout(function () {
			elem1.style.cssText = '';
			elem2.style.cssText = '';
		}, 150);
	}
	//End switch element

	//Switch elements
	function switchElementsIE(elem1, elem2){
		var auxEl;

		if (getIndexNo(elem1) > getIndexNo(elem2)) {
			auxEl = elem1;
			elem1 = elem2;
			elem2 = auxEl
		}

		var aux = elementsObject[parseInt(elem1.getAttribute('data-rel'), 10)],
			auxDataRel = parseInt(elem1.getAttribute('data-rel'), 10),
			element1Bound, element2Bound;

		elementsObject[parseInt(elem1.getAttribute('data-rel'), 10)] = elementsObject[parseInt(elem2.getAttribute('data-rel'), 10)];
		elementsObject[parseInt(elem2.getAttribute('data-rel'), 10)] = aux;
		elem1.setAttribute('data-rel', elem2.getAttribute('data-rel'));
		elem2.setAttribute('data-rel', auxDataRel);
		elem1.parentNode.insertBefore(elem2, elem1);
		elem1.style.top = '-40px';
		elem1.style.transition = 'top 0';
		elem2.style.top = '40px';
		elem2.style.transition = 'top 0';
	
		elem1.offsetWidth;
		elem2.offsetWidth;
	
		elem1.style.top = '0px';
		elem2.style.top = '0px';
	
		setTimeout(function () {
			elem1.style.cssText = '';
			elem2.style.cssText = '';
		}, 150);
	}
	//End switch element

	function generateHandlers(elem) {
		var handler;
        if (elem) {
            if (requiresHandlers) {
                handler = document.createElement('span');
                handler.className = handlerClass;
                elem.appendChild(handler)
                handler.handleFor = elem;
            } 
        } else {
    		for (var i = 0; i < dragElements.length; i++) {
    			dragElements[i].className = 'partial-handler';
    			if (generateHandler) {
    				handler = document.createElement('span');
    				handler.className = handlerClass;
    				dragElements[i].appendChild(handler);
    			} else {
    				handler = dragElements[i].querySelector('.' + handlerClass);
    			}
    			if (handler) {
    				handler.handleFor = dragElements[i];
    			}
    		}
        }
	}

	function activateDrag(e) {
		if (e.target.className.search(handlerClass) !== -1) {
			e.target.handleFor.setAttribute('draggable', 'true');
		}
	}

	function cancelDrag(e) {
		if (e.target.className.search(handlerClass) !== -1) {
			e.target.handleFor.setAttribute('draggable', 'false');
		}
	}

	if (requiresHandlers) {
		generateHandlers();
		container.addEventListener('mouseover', activateDrag);
		container.addEventListener('mouseout', cancelDrag);
	}
	//Parse Object
	function objectParse(elem) { 
		var newObject = [];
		for (var i=0; i<elem.length; i++) {
			if (elem[i].element.querySelector('span')) {childHandlerContent = elem[i].element.querySelector('span').innerHTML;}
			newObject.push({
				'id': elem[i].element.getAttribute('data-id'),
				'content':elem[i].element.querySelector('input').value,
				'handler': childHandlerContent,
				'dept': elem[i].dept
			});
		}
		return newObject;
	}
	//End Parse Object
	//Order Object
	function initalSort(element) {
		var orderedElements = [], newAddedItem, newAddedItemObject = [];
		for (var i=0; i<element.length; i++) {
			if (saveList && window.localStorage[elementId] !== undefined) {
				if (JSON.parse(window.localStorage[elementId])[i].handler) {
					childHandler = JSON.parse(window.localStorage[elementId])[i].handler;
				}
				newAddedItem = document.createElement('li');
				newAddedItem.innerHTML = '<div class="gs-overlay"></div><input type="text" value="'+JSON.parse(window.localStorage[elementId])[i].content+'" name="'+JSON.parse(window.localStorage[elementId])[i].id+'" readonly disabled>' + childHandler;
				newAddedItem.setAttribute('draggable','true');
				newAddedItem.setAttribute('id', 'dragged-element' + randomId + '-' +JSON.parse(window.localStorage[elementId])[i].id);
				newAddedItem.setAttribute('data-id', JSON.parse(window.localStorage[elementId])[i].id);
				newAddedItem.setAttribute('data-rel', i);
				newAddedItem.addEventListener('dragstart', dragStartElement);
				newAddedItem.addEventListener('dragenter', getIEVersion() ? dragEnterElementIE : dragEnterElement)
				newAddedItem.addEventListener('dragleave', dragLeaveElement);
				newAddedItem.addEventListener('dragover', dragOverElement);
				newAddedItem.addEventListener('dragend', dragEndElement);
				newAddedItem.addEventListener('drop', dragDropElement);
				newAddedItemObject[i] = newAddedItem;
				
			} else {
				inputOverlay = document.createElement('div');
				inputOverlay.className = 'gs-overlay';
				newAddedItemObject[i] = container.querySelector('#dragged-element' + randomId + '-' +element[i]);
				container.querySelector('#dragged-element' + randomId + '-' +element[i]).appendChild(inputOverlay);
			}
			orderedElements.push(
				newAddedItemObject[i]
			);
		}

		if (editItem) AddEditItems(orderedElements);	//add edit buttons
		if (deleteItem) AddDeleteItems(orderedElements);	//add edit buttons

		if (saveList && window.localStorage[elementId] !== undefined) {
			container.innerHTML = '';
		}

		for (var i=0; i<orderedElements.length; i++) {
			container.appendChild(orderedElements[i]);
		}
		dragElements = container.querySelectorAll('li');
  	};
  	//End Order Object
	//Generate Initial Object
	function initialObject() {
		dragElements = '';
		dragElements = container.querySelectorAll('li');

		elementsObject = [];

		for (var i=0; i<dragElements.length; i++) {
			dragElements[i].setAttribute('data-rel', i);
			elementsObject.push({
				'element': dragElements[i],
				'dept': '0'
			});
		}
	}
	//End Generate Initial Object
}