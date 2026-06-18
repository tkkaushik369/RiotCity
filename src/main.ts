import './style.css'
import * as THREE from 'three/webgpu'
// import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as scene_data from './scene.json'
import { CityBuilder } from './City/GridCityBuilder'
import { CannonDebugRenderer } from './CannonDebugRenderer'
import { Inspector } from 'three/addons/inspector/Inspector.js'
import { BoxCollider } from './Physics/BoxCollider'
import { TrimeshCollider } from './Physics/TrimeshCollider'
// import { ViewHelper } from 'three/examples/jsm/helpers/ViewHelper.js'

// Canvas
// const canvas = document.createElement('canvas') as HTMLCanvasElement
// document.body.appendChild(canvas)

// renderer
const renderer = new THREE.WebGPURenderer({
	// const renderer = new THREE.WebGLRenderer({
	antialias: true,
	// preserveDrawingBuffer: true,
	// canvas: canvas,
	// logarithmicDepthBuffer: true,
	// reversedDepthBuffer: true
})
await renderer.init()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setClearColor(0x000000, 1)
renderer.toneMapping = THREE.NeutralToneMapping
const inspector = new Inspector()
// renderer.inspector = inspector
document.body.appendChild(renderer.domElement)
document.body.appendChild(inspector.domElement)

// scene and world
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x2a2a2a)
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)
world.broadphase = new CANNON.NaiveBroadphase()
;(world.solver as CANNON.GSSolver).iterations = 10
world.allowSleep = true

var bodies: (BoxCollider | TrimeshCollider)[] = []

// Debug
const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

// camera
const aspect = window.innerWidth / window.innerHeight
// const frustumSize = 16
const frustumSize = 8
// const frustumSize = 1

var currentCamera: THREE.Camera
const cameraPersp = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const cameraOrtho = new THREE.OrthographicCamera(
	-frustumSize * aspect,
	frustumSize * aspect,
	frustumSize * aspect,
	-frustumSize * aspect,
	-1000,
	1000
)

currentCamera = cameraPersp
currentCamera.position.set(0, 160, 0)

// lights
scene.add(new THREE.AmbientLight(0x404040))
scene.add(new THREE.HemisphereLight(0xbfd1ff, 0x202020, 0.9))

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
directionalLight.shadow.camera.near = 0.5
directionalLight.shadow.camera.far = 1024
directionalLight.position.set(25, 50, 25)
scene.add(directionalLight)

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1)
directionalLight2.position.set(25, -50, -15)
scene.add(directionalLight2)

// controls
const controls = new OrbitControls(currentCamera, renderer.domElement)
controls.enableDamping = false

// view helper
// const viewHelper = new ViewHelper(currentCamera, document.getElementById("app") as HTMLDivElement)
// const viewHelper = new ViewHelper(currentCamera, renderer.domElement)
// viewHelper.animating = true
// viewHelper.setLabels("X", "Y", "Z")
// const clock = new THREE.Clock()
// scene.add(viewHelper)

// viewHelper.handleClick = function (e: MouseEvent) {
// 	console.log(e)
// 	return true
// }

const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()

// const gui1 = renderer.inspector.createParameters('Scene settings')
// gui1.add(helpers, 'visible').name('show helpers')
// console.log(gui1)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
	const aspect = window.innerWidth / window.innerHeight

	cameraPersp.aspect = window.innerWidth / window.innerHeight
	cameraPersp.updateProjectionMatrix()

	cameraOrtho.left = cameraOrtho.bottom * aspect
	cameraOrtho.right = cameraOrtho.top * aspect
	cameraOrtho.updateProjectionMatrix()

	renderer.setSize(window.innerWidth, window.innerHeight)
	render()
}

function downloadData(storageObj: object) {
	var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storageObj))
	var dlAnchorElem = document.createElement('a')
	dlAnchorElem.setAttribute('href', dataStr)
	dlAnchorElem.setAttribute('download', 'scene.json')
	dlAnchorElem.click()
}

const settings = {
	preload_buildins: 0,
	seed: 0, // 10
	corner: 3,
	footpath: 2,
	allysize: 10, // 20
	floorsize: 5,
	block_types_1: 3,
	block_types_2: 1,
	block_types_3: 1,
	size: 3,
	corner_size: 0.25,
	renderHelper: false,
	renderDebugsWireframe: false,
	renderDebug: -1,
	renderBuildings: true,
	renderBuildingsRoofs: true,
	renderBuildingsWindows: true,
	simple_geometry: true,
	renderDebugsBuildings: false,
	renderDebugsBuildingsWireframe: true,
	renderLights: false,
	renderNodePaths: false,
	terrainFov: 2,
	camera: 'Orthographic',
	generate: generate,
	download: () => {
		const cityData = cityBuilder.getData()
		// console.table(cityData)
		downloadData(cityData)
	},
}

const riotFolder = gui.addFolder('Riot')
const riotCity = riotFolder.addFolder('City')
const riotSettings = riotCity.addFolder('Settings')
riotSettings.add(settings, 'camera', ['Perspective', 'Orthographic']).name('Camera').onChange(changeCamera)
riotSettings.add(settings, 'seed', 0, 100000).onChange(() => generate(false))
riotSettings.add(settings, 'corner', 1, 30, 1).onChange(() => generate(false))
riotSettings.add(settings, 'footpath', 1, 30, 1).onChange(() => generate(false))
riotSettings.add(settings, 'allysize', 4, 30, 1).onChange(() => {
	settings.generate(false)
})
riotSettings.add(settings, 'size', 1, 150, 1).onChange(() => {
	settings.generate(false)
})

const riotRender = riotCity.addFolder('Render')
riotRender
	.add(settings, 'renderHelper')
	.name('Grid Helper')
	.onChange(() => {
		generate(false, true)
	})
riotRender
	.add(settings, 'renderDebugsWireframe')
	.name('Debug Wireframe')
	.onChange(() => generate(false, true))
riotRender.add(settings, 'renderDebug', -1, 2, 1).onChange(() => generate(false, true))
riotRender
	.add(settings, 'renderLights')
	.name('Lights')
	.onChange(() => generate(false, true))
riotRender
	.add(settings, 'renderNodePaths')
	.name('Node Paths')
	.onChange(() => generate(false, true))

const riotBuilding = riotRender.addFolder('Building')
riotBuilding
	.add(settings, 'renderBuildings')
	.name('Buildings')
	.onChange(() => generate(false, true))
riotBuilding
	.add(settings, 'renderBuildingsRoofs')
	.name('Buildings Roofs')
	.onChange(() => generate(false, true))
riotBuilding
	.add(settings, 'renderBuildingsWindows')
	.name('Buildings Windows & Doors')
	.onChange(() => generate(false, true))
riotBuilding
	.add(settings, 'simple_geometry')
	.name('Simpe Geometry')
	.onChange(() => generate(false, true))

const riotBuildingDebug = riotBuilding.addFolder('Debug')
riotBuildingDebug
	.add(settings, 'renderDebugsBuildings')
	.name('Debug Buildings')
	.onChange(() => generate(false, true))
riotBuildingDebug
	.add(settings, 'renderDebugsBuildingsWireframe')
	.name('Debug Buildings Wireframe')
	.onChange(() => generate(false, true))

riotFolder.add(settings, 'generate')
riotFolder.add(settings, 'download')
riotSettings.close()
riotRender.close()

const cityBuilder = new CityBuilder(
	settings,
	() => {
		generate(false)
	},
	(prog: number) => {
		console.log(Number(prog).toFixed(2) + '%')
	}
)
cityBuilder.render_done = (): void => {
	addPhysics()
}
scene.add(cityBuilder)

// cityBuilder.setData(scene_data.ally_data, scene_data.settings)
// cityBuilder.render()
// console.log(scene_data)
function addBody(ent: THREE.Object3D, type: string, instanced: boolean) {
	const pos_g = new THREE.Vector3()
	const quat_g = new THREE.Quaternion()
	ent.getWorldPosition(pos_g)
	ent.getWorldQuaternion(quat_g)
	// console.log((ent as any).geometry.type, type)
	switch (type) {
		case 'box': {
			function createBody(pos: THREE.Vector3, quat: THREE.Quaternion, scale: THREE.Vector3) {
				const collider = new BoxCollider(new THREE.Vector3(scale.x, scale.y, scale.z))
				collider.body.position.x = pos.x
				collider.body.position.y = pos.y
				collider.body.position.z = pos.z
				collider.body.quaternion.x = quat.x
				collider.body.quaternion.y = quat.y
				collider.body.quaternion.z = quat.z
				collider.body.quaternion.w = quat.w
				world.addBody(collider.body)
				bodies.push(collider)
			}
			if (instanced) {
				const entI = ent as THREE.InstancedMesh
				const pos = new THREE.Vector3()
				const scale = new THREE.Vector3()
				const quat = new THREE.Quaternion()
				const matrix = new THREE.Matrix4()
				for (let i = 0; i < entI.count; i++) {
					entI.getMatrixAt(i, matrix)
					matrix.decompose(pos, quat, scale)
					createBody(pos, quat, scale.multiplyScalar(0.5))
				}
			} else {
				createBody(pos_g, quat_g, new THREE.Vector3(ent.scale.x, ent.scale.y, ent.scale.z))
			}
			break
		}
		case 'trimesh': {
			function createBody(pos: THREE.Vector3, quat: THREE.Quaternion) {
				const collider = new TrimeshCollider(ent)
				collider.body.position.x = pos.x
				collider.body.position.y = pos.y
				collider.body.position.z = pos.z
				collider.body.quaternion.x = quat.x
				collider.body.quaternion.y = quat.y
				collider.body.quaternion.z = quat.z
				collider.body.quaternion.w = quat.w
				world.addBody(collider.body)
				bodies.push(collider)
			}
			if (instanced) {
				const entI = ent as THREE.InstancedMesh
				const pos = new THREE.Vector3()
				const scale = new THREE.Vector3()
				const quat = new THREE.Quaternion()
				const matrix = new THREE.Matrix4()
				for (let i = 0; i < entI.count; i++) {
					entI.getMatrixAt(i, matrix)
					matrix.decompose(pos, quat, scale)
					createBody(pos, quat)
				}
			} else {
				createBody(pos_g, quat_g)
			}
			break
		}
		default:
			break
	}
}

function clearBodies() {
	for (let i = 0; i < bodies.length; i++) {
		world.removeBody(bodies[i].body)
	}
	bodies = []
}

function addPhysics() {
	if (false) {
		let tot = 0
		clearBodies()
		cityBuilder.traverse((obj: THREE.Object3D) => {
			// console.log(obj.userData);
			if (obj.userData.hasOwnProperty('data') && obj.userData.data == 'physics') {
				addBody(obj, obj.userData.type, false)
				tot++
			} else if (obj.userData.hasOwnProperty('data') && obj.userData.data == 'physics_instance') {
				addBody(obj, obj.userData.type, true)
				tot++
			}
		})
	}
	// console.log(tot)
	console.log('Finished')
}

function generate(seedUpdate: boolean = true, render_only: boolean = false) {
	if (!cityBuilder.is_render_ready()) return
	if (settings.corner * 2 >= settings.allysize) return
	if (render_only == false) {
		cityBuilder.setData(scene_data.ally_data, settings)
		cityBuilder.generate(true)
	}
	clearBodies()
	cityBuilder.render()
	if (render_only == false) {
		if (seedUpdate) settings.seed++
	}
}

function changeCamera() {
	const position = currentCamera.position.clone()

	if (settings.camera === 'Perspective') {
		currentCamera = cameraPersp
	} else if (settings.camera === 'Orthographic') {
		currentCamera = cameraOrtho
	}
	currentCamera.position.copy(position)

	controls.object = currentCamera

	currentCamera.lookAt(controls.target.x, controls.target.y, controls.target.z)
	onWindowResize()
}

function animate() {
	render()
	stats.update()
}

function render() {
	// if (viewHelper.animating) {
	// 	const delta = clock.getDelta()
	// 	viewHelper.update(delta)
	// }
	controls.update()
	// viewHelper.update(clock.getDelta())
	cannonDebugRenderer.update()
	renderer.render(scene, currentCamera)
}

changeCamera()
if (settings.preload_buildins === 0) generate(false)
renderer.setAnimationLoop(animate)
