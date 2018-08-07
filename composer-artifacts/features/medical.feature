#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

Feature: Sample

    Background:
        Given I have deployed the business network definition ..
        And I have added the following participants of type nz.ac.auckland.HealthProvider
            | hid   | name 		| phone				| address 				|
            | H1 	| Alice     | 021765677   	    | 23 one street   	    |
            | H2   	| Bob       | 022687543        	| 12 second drive       |
        And I have added the following assets of type nz.ac.auckland.Patient
            | pid 										 | birthDate | ird          | first 	| last	   	 | race  | ethinicity | gender | birthplace 		| address 												| record |
            | ab6d8296-d3c7-4fef-9215-40b156db67ac       | 19/4/1994 | 999-55-1956  | Emmanuel  | Adams		 | white | irish      | Male   | Winchendon MA US	| 53 Kristopher Springs Suite 264 Whitman MA 02382 US	| []	 |
            | ab6d8296-d3c7-4fef-9215-40b156db67ac       | 1/6/1985  | 999-98-8389  | Martha	| McCullough | asian | chinese    | Female | Boston MA US		| 7 Wiley Points Newburyport MA 01951 US				| []	 |
        And I have issued the participant nz.ac.auckland.HealthProvider#H1 with the identity alice1
        And I have issued the participant nz.ac.auckland.HealthProvider#H2 with the identity bob1

# Doesn't work because the record list :/
#   Scenario: Alice can read all of the patients
#       When I use the identity alice1
#       Then I should have the following assets of type nz.ac.auckland.Patient
#           | pid 										 | birthDate | ird          | first 	| last	   	 | race  | ethinicity | gender | birthplace 		| address 												| record |
#           | ab6d8296-d3c7-4fef-9215-40b156db67ac       | 19/4/1994 | 999-55-1956  | Emmanuel  | Adams		 | white | irish      | Male   | Winchendon MA US	| 53 Kristopher Springs Suite 264 Whitman MA 02382 US	| []	 |
#           | ab6d8296-d3c7-4fef-9215-40b156db67ac       | 1/6/1985  | 999-98-8389  | Martha	| McCullough | asian | chinese    | Female | Boston MA US		| 7 Wiley Points Newburyport MA 01951 US				| []	 |

#   Scenario: Bob can read all of the patients
#       When I use the identity bob1
#       Then I should have the following assets of type nz.ac.auckland.Patient
#           | pid 										 | birthDate | ird          | first 	| last	   	 | race  | ethinicity | gender | birthplace 		| address 												| record |
#           | ab6d8296-d3c7-4fef-9215-40b156db67ac       | 19/4/1994 | 999-55-1956  | Emmanuel  | Adams		 | white | irish      | Male   | Winchendon MA US	| 53 Kristopher Springs Suite 264 Whitman MA 02382 US	| []	 |
#           | ab6d8296-d3c7-4fef-9215-40b156db67ac       | 1/6/1985  | 999-98-8389  | Martha	| McCullough | asian | chinese    | Female | Boston MA US		| 7 Wiley Points Newburyport MA 01951 US				| []	 |