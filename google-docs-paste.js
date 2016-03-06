var DriveParser = function(){
	var self = this;
	var content;

	this.iterations = [];

	this.setContent = function(content) {
		self.content = content;
		return self;
	}

	this.stylePatterns = [
		{
			"search": "font-weight:[ ]+700",
			"replace": "b"
		},
		{
			"search": "font-style:[ ]+italic",
			"replace": "i"
		},
		{
			"search": "text-decoration:[ ]+underline",
			"replace": "u"
		}
	];

	this.preserveNodes = [
		{
			"nodeName": "A",
			"replace": function(node) {
				var a = document.createElement("a");
				var content = node.textContent;
				content = document.createTextNode(content);
				a.setAttribute('href', node.getAttribute('href'));
				a.setAttribute('target', node.getAttribute('target'));
				a.setAttribute('title', node.getAttribute('title'));
				a.setAttribute('alt', node.getAttribute('alt'));
				a.appendChild(content);
				return a;
			}
		},
        {
            "nodeName": "P",
            "replace": function(node) {
                if (node.parentNode.nodeName == "LI") {
                    console.log("Removing P inside LI");
                    var content = node.textContent;
                    content = document.createTextNode(content);
                    var parent = node.parentElement;
                    parent.replaceChild(content, node);
                    return node;
                }
                else {
                    while (node.attributes.length > 0) {
                        node.removeAttribute(node.attributes[0].name);
                    }
                    return node;
                }
            }
        },
        {
            "nodeName": "LI",
            "replace": function(node) {
                while (node.attributes.length > 0) {
                    node.removeAttribute(node.attributes[0].name);
                }
                return node;
            }
        },
		{
			"nodeName": "BR",
			"replace": function(node) {
				return document.createElement("br");
			}
		}
	];

	this.parse = function() {
		// Strip html comments.
		self.content = self.content.replace(/<\!--([^-]+)-->/g, "");
		self.content = self.content.replace(/<meta[^>]*>/g, "");
		//console.log(self.content);

		var root = document.createElement('body');
		root.innerHTML = self.content;

		// Parse the input html. This will basically
		// search for well known style patterns to
		// replace them with an alternative short tag.
		this.browse(root, root);
		console.log(root.cloneNode(true));

		// Remove all unwanted html tags, except for the
		// ones we want to rewrite.
		this.stripTags(root, root);
		console.log(root);

		return this.cleanup(root.innerHTML);
	}

	this.stripTags = function(node, root) {
		if ( node.nodeType == Node.TEXT_NODE ) {
			return;
		}

		var parent = node.parentElement;
		console.log("Check " + node.nodeName + " for strip");
		console.log(node.cloneNode(true).children);

        if (node.childNodes.length) {
            for (var i = 0; i < node.childNodes.length; i++) {
                this.stripTags(node.childNodes[i], root);
            }
        }

		if ( node.nodeType == Node.ELEMENT_NODE && ! $(node).hasClass('processed') && parent ) {
			// If a node has a replacement, don't process it now.
			if ( ! this.shouldPreserveNode(node) ) {
				console.log("strip " + node.nodeName);
				console.log(node.cloneNode(true));
				console.log(node.cloneNode(true).children);
				console.log(node.children);
				console.log(parent);
				var html = node.innerHTML;

				if (node.childNodes.length) {
					console.log("frag");
					var fragment = document.createDocumentFragment();
					for (var j = 0; j < node.childNodes.length; j++) {
						console.log("append " + node.childNodes[j].nodeName + " to frag");
						fragment.appendChild(node.childNodes[j].cloneNode(true));
					}
					console.log(node.cloneNode(true).children);
					parent.replaceChild(fragment, node);
				} else {
					console.log("remove");
					parent.removeChild(node);
				}

			} else {
				console.log("preserve " + node.nodeName);
				parent.replaceChild(this.getNodeReplacement(node), node);
			}
			console.log(root.cloneNode(true));
		}
	}

	this.shouldPreserveNode = function(node) {
		for (var i = 0; i < this.preserveNodes.length; i++) {
			if (this.preserveNodes[i].nodeName == node.nodeName) {
				return true;
			}
		}
		return false;
	}

	this.getNodeReplacement = function(node) {
		for (var i = 0; i < this.preserveNodes.length; i++) {
			if (this.preserveNodes[i].nodeName == node.nodeName) {
				return this.preserveNodes[i].replace(node);
			}
		}
		return null;
	}

	this.browse = function(node, root) {
		if (node.childNodes.length) {
			for (var i = 0; i < node.childNodes.length; i++) {
				this.browse(node.childNodes[i], root);
			}
		}

		if (node != root && node.nodeName == "SPAN" || node.nodeName == "P") {
			return this.processNode(node);
		}

	}

	this.processNode = function(node) {
		//console.log("Processing " + node.nodeName);
		var parent = node.parentElement;
		var child = null;
		var replaced = false;

		if (parent && node.style) {
			angular.forEach(this.stylePatterns, function(item){
				if (node.style.cssText.match(new RegExp(item.search))) {
					//console.log("Found " + item.search + " on " + node.textContent);
					var tag = document.createElement(item.replace);

					if (child) {
						console.log("append subchild");
						parent.replaceChild(tag, child);
						tag.appendChild(child);
						child = tag;
					} else {
						console.log("append first child to " + parent.nodeName);
						tag.appendChild(document.createTextNode(node.textContent));
						parent.replaceChild(tag, node);
						child = tag;
					}
					//tag.setAttribute('processed', true);
					$(tag).addClass('processed');
					//parent.removeChild(node);
					replaced = true;
				}
			});


		}

		return replaced;

	}

	this.cleanup = function(content) {
		if (content) {
			content = content
					.replace(/\n/g, "")
					.replace(/“/g, "\"")
					.replace(/”/g, "\"")
					.replace(/’/g, "\'")
					.replace(/‘/g, "\'")
			;
		}
		return content;
	}
};