import { addMocksToSchema } from '@graphql-tools/mock'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLScalarType, Kind } from 'graphql'

const typeDefinitions = /* GraphQL */ `
    scalar Date
# TODO: explore the queries Jenne is currently doing 
# Question from Jenne: This would be querying the NML database ? Or the ones we run on our side after the data is entered ?
# What are useful ways to query / search for clusters and isolates ?
    type Query {
    # This is a total guess:
    cluster(id: ID!): Cluster # get a cluster using a unique id.
        allClustersBetween(start: Date! end: Date!): [Cluster] # get all clusters within a date range
    multiProviceClustersBetween(start: Date! end: Date!): [Cluster] # get all clusters within a date range
    isolate(id: ID!): Isolate # get an isolate using a unique id
    isolatesAfter(isolationDate: Date!): [Isolate] # get all isolates after CINPHI posting date
    # ...and / or anything else we can think of!
    #Additions by Jenne:
    #all isolates for a certain cluster code
    isolatesFor(cluster: ID!): [Isolate]
    clustersForPathogen(pathogen: String!): [Cluster]
    isolatesForPathogen(pathogen: String!): [Isolate]
}

# TODO: are there fields on these types that are likely to contain PII ?
# No personally identifiable information is collected or shared in these extracts.However, it sounds like it may be protected B.

# The Isolate type is what will be returned by some of those queries.
# TODO: Isolates should link back to clusters right ?
    #Yes, isolates are linked to clusters using the Outbreak variable
# TODO: Isolates should link to pathogens...? 
# Right now, NML sends us the isolate data split up by pathogen.We will want a Pathogen variable to identify which pathogen the isolate belongs to.
type Isolate  {
  # Date_Posted_to_CNPHI
postedOn: Date
  # Key
id: ID!
  # SourceState
sourceProvice: String # Provice! TODO: open text field.Probably need to clean.
  # Organism: 
  # Once the data has been cleaned it could be a type.The current extract contains a bit more variation as it's an open text field.
organism: String # TODO: verify that this is just serotype and...remove ? 
  # SubmittedNumber
provincialSampleID: String # What does this number identify ? A submitter(person ? org ?) ? Submission order ?
    #This is the ID number that the P / T labs have assigned to the isolate when they submit samples to NML.
  # IsolatDate
isolatedOn: Date # GraphQL has types, so repeating the type name in the fieldname feels...repetative.
  # ReceivedDate
recievedOn: Date
  # UploadDate
uploadedOn: Date
  # Should these be a separate type ?
    #There is quite a bit of variation in this field, so I think it makes sense for the PFGE fields to be a string. 
  # PFGE_Xbal_pattern 
  # PFGE_Blnl_pattern
pfge: String # TODO: verify if needed
  # MLVA_Profile
MLVAProfile: String  # TODO: verify if needed
  # SourceType
sampleType: String # Food, Human, NonHuman
  # SourceSite
sampleSite: String # Stool, Blood, Foot Wound... basically anything
  # PatientSex
patientSex: String # Probably an enum 
  # PatientAge
#There are some text strings in the age field, so we are only able to import it as an integer after data cleaning.
    patientAge: Int # Convert to int.It's not that on the NML side
  # TypeDetails
typeDetails: String # Explaining duplicates ? TODO : clairify
  # Outbreak: Link to related Outbreak ?
    #This is the variable that contains the cluster code.The cluster code is the ID for a cluster.
        cluster: Cluster # Lab cluster... could go on for years.
  # Comments
  comments: String 
  # NLEP: Acronym for...
#I had to look it up but it stands for National Laboratory for Enteric Pathogens.I'm assuming the specimens are forwarded to this lab and this is their ID#.
  NLEP: String
  # ectyper:
ECtyper: String
  # Predicted_O_serotype
predictedOSerotype: String
  # Predicted_H_serotype
predictedHSerotype: String
  # Predicted_pathotype
predictedPathogenType: Pathogen # Link to pathogen #Actually we don't really use this field. I've added a new Pathogen field below which will be new for both sides but will help identify the Pathogen when all of the data is submitted together instead of in 6 different files.
  # Fast_Match_Result
fastMatch: String
  # Serotype
serotype: String # These seems like a short list that won't change. Is this an enum? 
#I believe there is some variation in how this field is filled out as it's open text.
  # WGST: Acronym for...
#Whole Genome Sequence Typing(I believe...).This is a lab method that is used on the isolates.
    WGST: String
  # SISTR Acronym for...
#Salmonella In Silico Typing Resource.Another lab testing method... I believe...
SISTR: String
  # Exposure_Details
#exposureDetails: String
  # ReceivedDate2: Why the duplication ? TODO : What is this field really ?
    #A very good question.I don't think this is a field we use so I think we can remove it. 
pathogen: Pathogen #Added by Jenne.Could be a type as there are only 6 options.

#Note from Jenne: I will ask the team to confirm if there are any of these fields that we never look at.Now seems as good a time as any to streamline this if possible!
}

enum Province {
    BC
  AB
  SK
  MB
  ON
  QC
  NL
  NS
  NB
  PE
  NU
  NT
  YK
}

type Pathogen {
    # Pathogen = models.ForeignKey(Pathogen, on_delete = models.PROTECT)
name: String
    # Serotype = models.CharField(max_length = 30, null = True, blank = True)
serotypes: [String] # Probably Enum ?
}

# These fields are copied from the Django model and there might be 
# fields here that don't come from the NML.
# TODO: remove anything that isn't coming from the NML
#Note from Jenne: I took a look at the Cluster line list and there isn't much we pull in from there. We mostly look at it to identify which clusters are new/have updates and then we look to the isolate line list for the details.
type Cluster {
    # OICC code: For OMD that's an "event id" 
#Outbreak Investigation Coordinating Committee.This is the "event ID" field that is sent back to NML and manually entered into their database.
    eventID: [ID] # A cluster that was investigated.Generated in CEDARS, and sent to NML 
    # pn_cluster = models.CharField(max_length = 30, unique = True)
id: ID # 
    # ClinIsolDate1 = models.DateField(null = True, blank = True) #This could be derived from the isolate line list but maybe that is getting fancy.
    # ClinIsolDate2 = models.DateField(null = True, blank = True)
    # TODO: We want the first isolation date and the _second_ isolation date.Helps epis get a sense of how "active" a cluster is.
    clinicallyIsolatedOn: Date # TODO rethink this.
        activity: String # eg: 6 weeks.Is that good ?
            provinces : [Province] # Nameing things is hard #PT is shorter and has more pizzazz ? Clusters often have multiple PTs.We currently have checkboxes in the Clusters model.This data could be pulled from Isolates.
    # Lab_Other = models.TextField(null = True, blank = True)
    # TODO: what's going on here?
labNotes: String
isolates: [Isolate] # link to the related isolate #Jenne suggests commenting this one out.These are different isolates we get from somewhere else, just to be confusing!
pathogen: Pathogen # Link to pathogen type
    # resistance_profile = models.BooleanField(default=False)
antiBioticResistant: Boolean #Not sure if OMD currently gets this from the lab, but Jenne to check.
}
`

const mocks = {
    String: () => 'Mock Data',
    Date: () => {
        return new Date()
    }
}

export const schema = addMocksToSchema({
    schema: makeExecutableSchema({
        typeDefs: [typeDefinitions]
    }),
    mocks: mocks
})
