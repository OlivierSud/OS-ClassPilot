const contentTranslations = {
    en: {
        // Change View
        changeView: [
            'Drag <em class="shortcut">Middle Mouse</em> to <em class="important">Rotate</em> the view. It rotates around an invisible <em class="important">Point of Interest</em>.',
            'Hold <em class="shortcut">Shift</em> and drag to <em class="important">Move</em> the point of interest.',
            'Hold <em class="shortcut">Ctrl</em> and drag or roll the <em class="shortcut">Mouse Wheel</em> to <em class="important">Zoom</em> in and out'
        ],
        
        // Axis View
        axisView: [
            '<em class="shortcut">Num 1</em>, <em class="shortcut">Num 3</em> & <em class="shortcut">Num 7</em> to view from <em class="important">Front</em>, <em class="important">Side</em> & <em class="important">Top</em>.',
            '<em class="shortcut">Num 9</em> to <em class="important">Invert</em> the current view direction.',
            '<em class="shortcut">Num 5</em> to toggle <em class="important">Orthographic</em> view.',
            '<em class="shortcut">Num 2</em>, <em class="shortcut">Num 4</em>, <em class="shortcut">Num 6</em>, <em class="shortcut">Num 8</em> to <em class="important">Rotate</em> the view in 15° steps.'
        ],
        
        // Camera View
        cameraView: [
            '<em class="shortcut">Numpad 0</em> to align the view with the scene camera.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Numpad 0</em> to align the view with the selected camera and make it the scene camera.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Alt</em> + <em class="shortcut">Numpad 0</em> to align the scene camera with the current view.'
        ],
        
        // Frame Selected
        frameSelected: [
            '<em class="shortcut">Numpad &#46;</em> to set the <em class="important">Point of Interest</em> to the current selection.',
            '<em class="shortcut">Numpad &#8725;</em> to toggle <em class="important">Local View</em> which also hides all but the selected object.'
        ],
        
        // Change Mode
        changeMode: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Tab</em> to see all available modes.',
            '<em class="shortcut">Tab</em> to toggle Edit mode directly.',
            'If the cursor is hovering a timeline, <em class="shortcut">Ctrl</em> + <em class="shortcut">Tab</em> to toggle graph view.'
        ],
        
        // Switch Object
        switchObject: [
            '<em class="shortcut">Alt</em> + <em class="shortcut">Q</em> to switch to the hovered object without changing modes.',
            'Works with all modes, including <em class="important">Pose Mode</em> on Armature objects.'
        ],
        
        // Move
        move: [
            'Press <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> or <em class="shortcut blue">Z</em> to lock to an axis. Press twice to switch from global to local axes.',
            '<em class="shortcut">Shift</em> + <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> or <em class="shortcut blue">Z</em> to exclude an axis.',
            'In <em class="important">Edit Mode</em>, press <em class="shortcut">G</em> twice to slide along existing edges.'
        ],
        
        // Rotate
        rotate: [
            'Press <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> or <em class="shortcut blue">Z</em> to lock to an axis. Press twice to switch from global to local axes.',
            '<em class="shortcut">Shift</em> + <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> or <em class="shortcut blue">Z</em> to exclude an axis.',
            'Press <em class="shortcut">R</em> twice to switch to gimbal mode.'
        ],
        
        // Scale
        scale: [
            'Press <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> or <em class="shortcut blue">Z</em> to lock to an axis. Press twice to switch from global to local axes.',
            '<em class="shortcut">Shift</em> + <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> or <em class="shortcut blue">Z</em> to exclude an axis.'
        ],
        
        // Add
        add: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">A</em> adds new data.',
            'Depending on the context, this can be a new object, a new mesh inside the active object or a new node.'
        ],
        
        // Delete
        deleteShortcut: [
            'Press <em class="shortcut">X</em> in <em class="important">Object Mode</em> to delete selected objects.',
            'Press <em class="shortcut">X</em> in <em class="important">Edit Mode</em> to delete selected vertices, edges or faces.'
        ],
        
        // Hide
        hide: [
            '<em class="shortcut">H</em> to hide the selection.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">H</em> to hide everything but the selection.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">H</em> to unhide all.',
            'Meshes that are hidden in <em class="important">Edit Mode</em> are visible in <em class="important">Object Mode</em>.'
        ],
        
        // Duplicate
        duplicate: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">D</em> to duplicate the selection.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">D</em> in <em class="important">Object Mode</em> to create <em class="important">Linked Duplicates</em>, which reference the original data instead of copying it.'
        ],
        
        // Change Shading
        changeShading: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">Z</em> to toggle <em class="important">Wireframe</em> and <em class="important">X-ray</em>, to see and select through the mesh.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">Z</em> to only toggle <em class="important">X-ray</em>.'
        ],
        
        // Selection Modes
        selectionModes: [
            '<em class="shortcut">1</em> for <em class="important">vertex select.</em>',
            '<em class="shortcut">2</em> for <em class="important">edge select.</em>',
            '<em class="shortcut">3</em> for <em class="important">face select.</em>',
            'Switching modes can change the selection!'
        ],
        
        // Snap
        snap: [
            'Move one thing precisely to another, especially useful to position the <em class="important">3D Cursor</em>.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">Right Mouse</em> to set the 3D cursor by hand.'
        ],
        
        // Clear Transform
        clearTransform: [
            'Only in <em class="important">Object Mode</em>',
            '<em class="shortcut">Alt</em> + <em class="shortcut">G</em> to clear location.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">R</em> to clear rotation.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">S</em> to clear scale.'
        ],
        
        // Apply
        apply: [
            'Only in <em class="important">Object Mode</em>',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">A</em> to apply changes to the transform.',
            'Applies modifiers if hovered in the list.'
        ],
        
        // Repeat Last
        repeatLast: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">R</em> to repeat the last action.',
            'Repeats <em class="important">Move</em>, <em class="important">Rotate</em> and <em class="important">Scale</em> relative to the result of the previous action.'
        ],
        
        // Select All
        selectAll: [
            '<em class="shortcut">A</em> to select all objects, meshes, keyframes etc. depending the context.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">A</em> to deselect all.'
        ],
        
        // Add to Selection
        addToSelection: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">Left Mouse</em> on unselected to add to the selection.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">Left Mouse</em> on selected to remove from the selection.'
        ],
        
        // Select Loop
        selectLoop: [
            '<em class="shortcut">Alt</em> + <em class="shortcut">Left Mouse</em> while the cursor is close to a crossing edge.',
            '<em class="shortcut">Alt</em>+<em class="shortcut">Shift</em>+<em class="shortcut">Left Mouse</em> to add or remove loops from the selection.',
            'Only works on multiple faces if they are four-sided ("quads").'
        ],
        
        // Select Path Area
        selectPathArea: [
            '<em class="shortcut">Ctrl</em>+<em class="shortcut">Left Mouse</em> to add the shortest path of vertices or faces to the selection.',
            '<em class="shortcut">Ctrl</em>+<em class="shortcut">Shift</em>+<em class="shortcut">Left Mouse</em> to add or remove an area.'
        ],
        
        // Select Linked
        selectLinked: [
            '<em class="shortcut">L</em> to select all linked vertices under the cursor.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">L</em> to remove all linked vertices from the selection',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">L</em> to select what is linked to the current selection.'
        ],
        
        // Select More Less
        selectMoreLess: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Num +</em> to select more.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Num -</em> to select less.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Shift</em> + <em class="shortcut">Num +</em> to select more elements with the same distance as the last two.'
        ],
        
        // Select Similar
        selectSimilar: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">G</em> to select all with similar traits to the current selection.',
            'Also works with objects or nodes selected (Select Grouped)'
        ],
        
        // Extrude
        extrude: [
            '<em class="shortcut">E</em> to extrude a connected copy of the selected mesh and wait for input to be moved.',
            '<em class="shortcut">ESC</em> or <em class="shortcut">Right click</em> to end the extrusion without moving it. Creates "doubles"!',
            '<em class="shortcut">Alt</em> + <em class="shortcut">E</em> for more options.'
        ],
        
        // Inset
        inset: [
            '<em class="shortcut">I</em> to inset around the selected faces.',
            'Press <em class="shortcut">I</em> again to inset individual faces.',
            'Press <em class="shortcut">O</em> to toggle outset.',
            'Press <em class="shortcut">B</em> to toggle boundary.'
        ],
        
        // Add Face
        addFace: [
            '<em class="shortcut">F</em> to add a new face to the mesh. Adds a loose edge if two separate vertices are selected.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">F</em> to fill Ngons with triangles.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">F</em> to bring up all face options including "Grid Fill"'
        ],
        
        // Merge
        merge: [
            'Merge all selected vertices at a specified location.',
            '<em class="important">Merge By Distance</em> to remove vertices that are closer than the threshold value, which you can set in the context menu.'
        ],
        
        // Rip
        rip: [
            '<em class="shortcut">V</em> to rip vertices or edges.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">V</em> to rip and fill.',
            'The rip direction is determined by the cursor position.'
        ],
        
        // Split
        split: [
            '<em class="shortcut">Y</em> to split the selection.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">M</em> to split all selected faces by their edges.',
            'The selection is disconnected but still part of the same data block and object.'
        ],
        
        // Separate
        separate: [
            '<em class="shortcut">P</em> to separate the selection into a new object.',
            'The new object will have the same modifiers as the object it was separated from.'
        ],
        
        // Loop Cut
        loopCut: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">R</em> to cut a loop if faces into segments.',
            'Roll the <em class="shortcut">Mouse Wheel</em> to change the number of segments.',
            'Only works on multiple faces if they are four-sided ("quads").'
        ],
        
        // Connect Path
        connectPath: [
            '<em class="shortcut">J</em> to connect vertices in the order in which they were selected.',
            'Cuts into faces and creates additional vertices when the path intersects with existing edges.'
        ],
        
        // Bevel
        bevel: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">B</em> to bevel edges.',
            'Roll the <em class="shortcut">Mouse Wheel</em> to adjust the number of segments.',
            '<em class="shortcut">V</em> to toggle vertex bevel.',
            '<em class="shortcut">C</em> to toggle clamping.',
            '<em class="shortcut">P</em> to adjust the bevel profile.'
        ],
        
        // Dissolve
        dissolve: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">X</em> to delete vertices but connect the surrounding edges. The result is based on the <em class="important">selection mode</em>.',
            '<em class="shortcut">X</em><em class="important"> > Limited Dissolve</em> dissolves all vertices/edges below a treshold angle.'
        ],
        
        // Shrink/Fatten
        shrinkFatten: [
            'In <em class="important">Edit Mode</em>, <em class="shortcut">Alt</em> + <em class="shortcut">S</em> to move vertices along their vertex normals.'
        ],
        
        // Proportional Editing
        proportionalEditing: [
            '<em class="shortcut">O</em> to toggle proportional editing.',
            'Roll the <em class="shortcut">Mouse Wheel</em> to change the radius.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">O</em> to change the falloff profile.'
        ],
        
        // Search
        search: [
            '<em class="shortcut">F3</em> to open operator search.',
            '<em class="shortcut">Arrow Up</em> and <em class="shortcut">Arrow Down</em> to navigate, <em class="shortcut">Enter</em> to select.'
        ],
        
        // Rename
        rename: [
            '<em class="shortcut">F2</em> to rename the active object.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">F2</em> to <em class="important">Batch Rename</em> several objects at once.'
        ],
        
        // Extrude to Cursor
        extrudeToCursor: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Right Mouse</em> to extrude to the cursor position and adjust the rotation of the previous segment.',
            'Extrusions will be placed at the depth of the 3D cursor.'
        ],
        
        // Snap Toggle
        snapToggle: [
            'Hold <em class="shortcut">Ctrl</em> to enable snapping.',
            'Works with <em class="important">Move</em>, <em class="important">Rotate</em> and <em class="important">Scale</em> as well as <em class="important">Sliders</em>',
            'You can snap to increments (default) or geometry (vertices, edges, faces).'
        ],
        
        // Granular Input
        granularInput: [
            'Hold <em class="shortcut">Shift</em> to divide the mouse input for more precise control.',
            'Works with <em class="important">Move</em>, <em class="important">Rotate</em> and <em class="important">Scale</em> as well as <em class="important">Sliders</em>'
        ],
        
        // Multi-Edit
        multiEdit: [
            'If you have multiple objects selected, editing parameters will only affect the <em class="important">active</em> object.',
            'Hold <em class="shortcut">Alt</em> to change the parameters of <em class="important">all selected</em> objects instead.'
        ],
        
        // To Sphere
        toSphere: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">Alt</em> + <em class="shortcut">S</em> moves selected vertices to approach a sphere with the <em class="important">3D cursor</em> at the center.',
            'Turns a single loop of vertices into a circle.'
        ],
        
        // Subdivision Surface
        subdivisionSurface: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">1, 2, 3</em> to add a subdivision surface modifier with corresponding levels.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">0</em> will disable the modifier (level 0).'
        ]
    },
    
    fr: {
        // Change View
        changeView: [
            'Faites glisser la <em class="shortcut">Molette</em> pour <em class="important">Pivoter</em> la vue. Elle pivote autour d\'un <em class="important">Point d\'intérêt</em> invisible.',
            'Maintenez <em class="shortcut">Shift</em> et faites glisser pour <em class="important">Déplacer</em> le point d\'intérêt.',
            'Maintenez <em class="shortcut">Ctrl</em> et faites glisser ou roulez la <em class="shortcut">Molette</em> pour <em class="important">Zoomer</em>'
        ],
        
        // Axis View
        axisView: [
            '<em class="shortcut">Num 1</em>, <em class="shortcut">Num 3</em> et <em class="shortcut">Num 7</em> pour voir depuis <em class="important">Face</em>, <em class="important">Côté</em> et <em class="important">Dessus</em>.',
            '<em class="shortcut">Num 9</em> pour <em class="important">Inverser</em> la direction de vue actuelle.',
            '<em class="shortcut">Num 5</em> pour basculer la vue <em class="important">Orthographique</em>.',
            '<em class="shortcut">Num 2</em>, <em class="shortcut">Num 4</em>, <em class="shortcut">Num 6</em>, <em class="shortcut">Num 8</em> pour <em class="important">Pivoter</em> la vue par pas de 15°.'
        ],
        
        // Camera View
        cameraView: [
            '<em class="shortcut">Numpad 0</em> pour aligner la vue avec la caméra de la scène.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Numpad 0</em> pour aligner la vue avec la caméra sélectionnée et en faire la caméra de la scène.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Alt</em> + <em class="shortcut">Numpad 0</em> pour aligner la caméra de la scène avec la vue actuelle.'
        ],
        
        // Frame Selected
        frameSelected: [
            '<em class="shortcut">Numpad &#46;</em> pour définir le <em class="important">Point d\'intérêt</em> sur la sélection actuelle.',
            '<em class="shortcut">Numpad &#8725;</em> pour basculer la <em class="important">Vue locale</em> qui masque également tous les objets sauf celui sélectionné.'
        ],
        
        // Change Mode
        changeMode: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Tab</em> pour voir tous les modes disponibles.',
            '<em class="shortcut">Tab</em> pour basculer directement en mode édition.',
            'Si le curseur survole une timeline, <em class="shortcut">Ctrl</em> + <em class="shortcut">Tab</em> pour basculer la vue graphique.'
        ],
        
        // Switch Object
        switchObject: [
            '<em class="shortcut">Alt</em> + <em class="shortcut">Q</em> pour passer à l\'objet survolé sans changer de mode.',
            'Fonctionne avec tous les modes, y compris le <em class="important">Mode pose</em> sur les objets Armature.'
        ],
        
        // Move
        move: [
            'Appuyez sur <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> ou <em class="shortcut blue">Z</em> pour verrouiller sur un axe. Appuyez deux fois pour passer des axes globaux aux axes locaux.',
            '<em class="shortcut">Shift</em> + <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> ou <em class="shortcut blue">Z</em> pour exclure un axe.',
            'En <em class="important">Mode édition</em>, appuyez deux fois sur <em class="shortcut">G</em> pour glisser le long des arêtes existantes.'
        ],
        
        // Rotate
        rotate: [
            'Appuyez sur <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> ou <em class="shortcut blue">Z</em> pour verrouiller sur un axe. Appuyez deux fois pour passer des axes globaux aux axes locaux.',
            '<em class="shortcut">Shift</em> + <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> ou <em class="shortcut blue">Z</em> pour exclure un axe.',
            'Appuyez deux fois sur <em class="shortcut">R</em> pour passer en mode cardan.'
        ],
        
        // Scale
        scale: [
            'Appuyez sur <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> ou <em class="shortcut blue">Z</em> pour verrouiller sur un axe. Appuyez deux fois pour passer des axes globaux aux axes locaux.',
            '<em class="shortcut">Shift</em> + <em class="shortcut red">X</em>, <em class="shortcut green">Y</em> ou <em class="shortcut blue">Z</em> pour exclure un axe.'
        ],
        
        // Add
        add: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">A</em> ajoute de nouvelles données.',
            'Selon le contexte, cela peut être un nouvel objet, un nouveau maillage dans l\'objet actif ou un nouveau nœud.'
        ],
        
        // Delete
        deleteShortcut: [
            'Appuyez sur <em class="shortcut">X</em> en <em class="important">Mode objet</em> pour supprimer les objets sélectionnés.',
            'Appuyez sur <em class="shortcut">X</em> en <em class="important">Mode édition</em> pour supprimer les sommets, arêtes ou faces sélectionnés.'
        ],
        
        // Hide
        hide: [
            '<em class="shortcut">H</em> pour masquer la sélection.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">H</em> pour masquer tout sauf la sélection.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">H</em> pour tout afficher.',
            'Les maillages masqués en <em class="important">Mode édition</em> sont visibles en <em class="important">Mode objet</em>.'
        ],
        
        // Duplicate
        duplicate: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">D</em> pour dupliquer la sélection.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">D</em> en <em class="important">Mode objet</em> pour créer des <em class="important">Duplicatas liés</em>, qui référencent les données originales au lieu de les copier.'
        ],
        
        // Change Shading
        changeShading: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">Z</em> pour basculer <em class="important">Filaire</em> et <em class="important">Rayon X</em>, pour voir et sélectionner à travers le maillage.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">Z</em> pour basculer uniquement <em class="important">Rayon X</em>.'
        ],
        
        // Selection Modes
        selectionModes: [
            '<em class="shortcut">1</em> pour <em class="important">sélection de sommets.</em>',
            '<em class="shortcut">2</em> pour <em class="important">sélection d\'arêtes.</em>',
            '<em class="shortcut">3</em> pour <em class="important">sélection de faces.</em>',
            'Changer de mode peut modifier la sélection !'
        ],
        
        // Snap
        snap: [
            'Déplacez une chose précisément vers une autre, particulièrement utile pour positionner le <em class="important">Curseur 3D</em>.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">Clic droit</em> pour définir le curseur 3D manuellement.'
        ],
        
        // Clear Transform
        clearTransform: [
            'Seulement en <em class="important">Mode objet</em>',
            '<em class="shortcut">Alt</em> + <em class="shortcut">G</em> pour réinitialiser la position.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">R</em> pour réinitialiser la rotation.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">S</em> pour réinitialiser l\'échelle.'
        ],
        
        // Apply
        apply: [
            'Seulement en <em class="important">Mode objet</em>',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">A</em> pour appliquer les changements à la transformation.',
            'Applique les modificateurs si survolés dans la liste.'
        ],
        
        // Repeat Last
        repeatLast: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">R</em> pour répéter la dernière action.',
            'Répète <em class="important">Déplacer</em>, <em class="important">Rotation</em> et <em class="important">Échelle</em> relativement au résultat de l\'action précédente.'
        ],
        
        // Select All
        selectAll: [
            '<em class="shortcut">A</em> pour sélectionner tous les objets, maillages, images-clés etc. selon le contexte.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">A</em> pour tout désélectionner.'
        ],
        
        // Add to Selection
        addToSelection: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">Clic gauche</em> sur non-sélectionné pour ajouter à la sélection.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">Clic gauche</em> sur sélectionné pour retirer de la sélection.'
        ],
        
        // Select Loop
        selectLoop: [
            '<em class="shortcut">Alt</em> + <em class="shortcut">Clic gauche</em> lorsque le curseur est proche d\'une arête croisée.',
            '<em class="shortcut">Alt</em>+<em class="shortcut">Shift</em>+<em class="shortcut">Clic gauche</em> pour ajouter ou retirer des boucles de la sélection.',
            'Ne fonctionne sur plusieurs faces que si elles sont à quatre côtés ("quads").'
        ],
        
        // Select Path Area
        selectPathArea: [
            '<em class="shortcut">Ctrl</em>+<em class="shortcut">Clic gauche</em> pour ajouter le plus court chemin de sommets ou faces à la sélection.',
            '<em class="shortcut">Ctrl</em>+<em class="shortcut">Shift</em>+<em class="shortcut">Clic gauche</em> pour ajouter ou retirer une zone.'
        ],
        
        // Select Linked
        selectLinked: [
            '<em class="shortcut">L</em> pour sélectionner tous les sommets liés sous le curseur.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">L</em> pour retirer tous les sommets liés de la sélection',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">L</em> pour sélectionner ce qui est lié à la sélection actuelle.'
        ],
        
        // Select More Less
        selectMoreLess: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Num +</em> pour sélectionner plus.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Num -</em> pour sélectionner moins.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Shift</em> + <em class="shortcut">Num +</em> pour sélectionner plus d\'éléments avec la même distance que les deux derniers.'
        ],
        
        // Select Similar
        selectSimilar: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">G</em> pour sélectionner tout ce qui a des caractéristiques similaires à la sélection actuelle.',
            'Fonctionne également avec les objets ou nœuds sélectionnés (Sélection groupée)'
        ],
        
        // Extrude
        extrude: [
            '<em class="shortcut">E</em> pour extruder une copie connectée du maillage sélectionné et attendre une saisie pour être déplacée.',
            '<em class="shortcut">ESC</em> ou <em class="shortcut">Clic droit</em> pour terminer l\'extrusion sans la déplacer. Crée des "doublons" !',
            '<em class="shortcut">Alt</em> + <em class="shortcut">E</em> pour plus d\'options.'
        ],
        
        // Inset
        inset: [
            '<em class="shortcut">I</em> pour incruster autour des faces sélectionnées.',
            'Appuyez à nouveau sur <em class="shortcut">I</em> pour incruster les faces individuellement.',
            'Appuyez sur <em class="shortcut">O</em> pour basculer l\'excroissance.',
            'Appuyez sur <em class="shortcut">B</em> pour basculer la limite.'
        ],
        
        // Add Face
        addFace: [
            '<em class="shortcut">F</em> pour ajouter une nouvelle face au maillage. Ajoute une arête libre si deux sommets séparés sont sélectionnés.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">F</em> pour remplir les Ngones avec des triangles.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">F</em> pour afficher toutes les options de face, y compris "Remplissage grille"'
        ],
        
        // Merge
        merge: [
            'Fusionne tous les sommets sélectionnés à un emplacement spécifié.',
            '<em class="important">Fusionner par distance</em> pour supprimer les sommets qui sont plus proches que la valeur seuil, que vous pouvez définir dans le menu contextuel.'
        ],
        
        // Rip
        rip: [
            '<em class="shortcut">V</em> pour déchirer les sommets ou arêtes.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">V</em> pour déchirer et remplir.',
            'La direction de déchirement est déterminée par la position du curseur.'
        ],
        
        // Split
        split: [
            '<em class="shortcut">Y</em> pour diviser la sélection.',
            '<em class="shortcut">Alt</em> + <em class="shortcut">M</em> pour diviser toutes les faces sélectionnées par leurs arêtes.',
            'La sélection est déconnectée mais fait toujours partie du même bloc de données et objet.'
        ],
        
        // Separate
        separate: [
            '<em class="shortcut">P</em> pour séparer la sélection en un nouvel objet.',
            'Le nouvel objet aura les mêmes modificateurs que l\'objet dont il a été séparé.'
        ],
        
        // Loop Cut
        loopCut: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">R</em> pour couper une boucle de faces en segments.',
            'Faites rouler la <em class="shortcut">Molette</em> pour changer le nombre de segments.',
            'Ne fonctionne sur plusieurs faces que si elles sont à quatre côtés ("quads").'
        ],
        
        // Connect Path
        connectPath: [
            '<em class="shortcut">J</em> pour connecter les sommets dans l\'ordre dans lequel ils ont été sélectionnés.',
            'Coupe dans les faces et crée des sommets supplémentaires lorsque le chemin croise des arêtes existantes.'
        ],
        
        // Bevel
        bevel: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">B</em> pour biseauter les arêtes.',
            'Faites rouler la <em class="shortcut">Molette</em> pour ajuster le nombre de segments.',
            '<em class="shortcut">V</em> pour basculer le biseau de sommet.',
            '<em class="shortcut">C</em> pour basculer le serrage.',
            '<em class="shortcut">P</em> pour ajuster le profil du biseau.'
        ],
        
        // Dissolve
        dissolve: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">X</em> pour supprimer les sommets mais connecter les arêtes environnantes. Le résultat est basé sur le <em class="important">mode de sélection</em>.',
            '<em class="shortcut">X</em><em class="important"> > Dissolution limitée</em> dissout tous les sommets/arêtes en dessous d\'un angle seuil.'
        ],
        
        // Shrink/Fatten
        shrinkFatten: [
            'En <em class="important">Mode édition</em>, <em class="shortcut">Alt</em> + <em class="shortcut">S</em> pour déplacer les sommets le long de leurs normales de sommet.'
        ],
        
        // Proportional Editing
        proportionalEditing: [
            '<em class="shortcut">O</em> pour basculer l\'édition proportionnelle.',
            'Faites rouler la <em class="shortcut">Molette</em> pour changer le rayon.',
            '<em class="shortcut">Shift</em> + <em class="shortcut">O</em> pour changer le profil d\'atténuation.'
        ],
        
        // Search
        search: [
            '<em class="shortcut">F3</em> pour ouvrir la recherche d\'opérateur.',
            '<em class="shortcut">Flèche haut</em> et <em class="shortcut">Flèche bas</em> pour naviguer, <em class="shortcut">Entrée</em> pour sélectionner.'
        ],
        
        // Rename
        rename: [
            '<em class="shortcut">F2</em> pour renommer l\'objet actif.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">F2</em> pour <em class="important">Renommer par lot</em> plusieurs objets à la fois.'
        ],
        
        // Extrude to Cursor
        extrudeToCursor: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">Clic droit</em> pour extruder vers la position du curseur et ajuster la rotation du segment précédent.',
            'Les extrusions seront placées à la profondeur du curseur 3D.'
        ],
        
        // Snap Toggle
        snapToggle: [
            'Maintenez <em class="shortcut">Ctrl</em> pour activer l\'aimantation.',
            'Fonctionne avec <em class="important">Déplacer</em>, <em class="important">Rotation</em> et <em class="important">Échelle</em> ainsi qu\'avec les <em class="important">Curseurs</em>',
            'Vous pouvez aimanter aux incréments (par défaut) ou à la géométrie (sommets, arêtes, faces).'
        ],
        
        // Granular Input
        granularInput: [
            'Maintenez <em class="shortcut">Shift</em> pour diviser la saisie de la souris pour un contrôle plus précis.',
            'Fonctionne avec <em class="important">Déplacer</em>, <em class="important">Rotation</em> et <em class="important">Échelle</em> ainsi qu\'avec les <em class="important">Curseurs</em>'
        ],
        
        // Multi-Edit
        multiEdit: [
            'Si vous avez plusieurs objets sélectionnés, la modification des paramètres n\'affectera que l\'objet <em class="important">actif</em>.',
            'Maintenez <em class="shortcut">Alt</em> pour changer les paramètres de <em class="important">tous les objets sélectionnés</em> à la place.'
        ],
        
        // To Sphere
        toSphere: [
            '<em class="shortcut">Shift</em> + <em class="shortcut">Alt</em> + <em class="shortcut">S</em> déplace les sommets sélectionnés pour s\'approcher d\'une sphère avec le <em class="important">Curseur 3D</em> au centre.',
            'Transforme une seule boucle de sommets en cercle.'
        ],
        
        // Subdivision Surface
        subdivisionSurface: [
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">1, 2, 3</em> pour ajouter un modificateur de subdivision de surface avec les niveaux correspondants.',
            '<em class="shortcut">Ctrl</em> + <em class="shortcut">0</em> désactivera le modificateur (niveau 0).'
        ]
    }
};

// Mapping between HTML IDs and content translation keys
const contentIdMapping = {
    'ChangeView': 'changeView',
    'AxisView': 'axisView',
    'CameraView': 'cameraView',
    'FrameSelected': 'frameSelected',
    'ChangeMode': 'changeMode',
    'SwitchObject': 'switchObject',
    'Move': 'move',
    'Rotate': 'rotate',
    'Scale': 'scale',
    'Add': 'add',
    'Delete': 'deleteShortcut',
    'Hide': 'hide',
    'Duplicate': 'duplicate',
    'ChangeShading': 'changeShading',
    'SelectionModes': 'selectionModes',
    'Snap': 'snap',
    'ClearTransform': 'clearTransform',
    'Apply': 'apply',
    'RepeatLast': 'repeatLast',
    'SelectAll': 'selectAll',
    'AddToSelection': 'addToSelection',
    'SelectLoop': 'selectLoop',
    'SelectPathArea': 'selectPathArea',
    'SelectLinked': 'selectLinked',
    'SelectMoreLess': 'selectMoreLess',
    'SelectSimilar': 'selectSimilar',
    'Extrude': 'extrude',
    'Inset': 'inset',
    'AddFace': 'addFace',
    'Merge': 'merge',
    'Rip': 'rip',
    'Split': 'split',
    'Separate': 'separate',
    'LoopCut': 'loopCut',
    'ConnectPath': 'connectPath',
    'Bevel': 'bevel',
    'Dissolve': 'dissolve',
    'ShrinkFatten': 'shrinkFatten',
    'ProportionalEditing': 'proportionalEditing',
    'Search': 'search',
    'Rename': 'rename',
    'ExtrudeToCursor': 'extrudeToCursor',
    'SnapToggle': 'snapToggle',
    'GranularInput': 'granularInput',
    'MultiEdit': 'multiEdit',
    'ToSphere': 'toSphere',
    'SubdivModifier': 'subdivisionSurface'
};
