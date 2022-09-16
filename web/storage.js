let storage = ( function () {
	"use strict";

	let totalCapacity = null;

	return {
		"calculateLocalStorageCapacity": calculateLocalStorageCapacity,
		"getTotalCapacity": function () { return totalCapacity; },
		"getStorageUsed": getStorageUsed,
		"getFreeSpace": getFreeSpace
	};

	function calculateLocalStorageCapacity() {
		let delta = 4194304;
		let size = delta;
		let overMin = 16777216;
		let underMax = 0;
		runCapacityChecks();
			
		function runCapacityChecks() {
			let quickCheck = false;
			if( size >= overMin ) {
				quickCheck = true;
			}
			if( size < overMin && checkCapacity( size ) ) {
				size += delta;
				setTimeout( runCapacityChecks, 0 );
			} else {
				if( overMin - underMax <= 1 || delta === 1 ) {
					reportSize();
					return;
				}
				size = underMax;
				delta /= 2;
				while( size + delta >= overMin ) {
					delta /= 2;
				}
				if( delta < 1 ) {
					reportSize();
					return;
				}
				size += delta;
				if( quickCheck ) {
					runCapacityChecks();
				} else {
					setTimeout( runCapacityChecks, 0 );
				}
			}
		}
		
		function checkCapacity( size ) {
			try {
				let test = localStorage.getItem( "test" );
				if( ! test ) {
					test = "";
				}
				let newTest = test + ( new Array( size - test.length + 1 ).join( "a" ) );
				localStorage.setItem( "test", newTest );	
			} catch {
				if( overMin === -1 || overMin > size ) {
					overMin = size;
				}
				return false;
			}
			if( size > underMax ) {
				underMax = size;
			}
			return true;
		}
		
		function reportSize() {
			totalCapacity = new Blob( Object.values( localStorage ) ).size;
			localStorage.removeItem( "test" );
		}
	}

	function getStorageUsed() {
		return new Blob( Object.values( localStorage ) ).size;
	}

	function getFreeSpace() {
		if( totalCapacity ) {
			return totalCapacity - getStorageUsed();
		}
		return null;
	}

} )();

